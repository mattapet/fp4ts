// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, EitherT, Monad, Option, Map, Right } from '@fp4ts/cats';
import { Kind, pipe, snd } from '@fp4ts/core';
import { Ref } from '@fp4ts/effect';
import { MessageFailure, NotFoundFailure } from '@fp4ts/http';
import { CreateTodo, Todo } from '../todo';

export class TodoService<F> {
  public constructor(
    private readonly F: Monad<F>,
    private readonly nextId: Ref<F, number>,
    private readonly repo: Ref<F, Map<number, Todo>>,
  ) {}

  public getAll = (
    limit: Option<number>,
    offset: Option<number>,
  ): Kind<F, [Todo[]]> =>
    pipe(
      this.repo.get(),
      this.F.map(
        r =>
          r.toList
            .drop(offset.getOrElse(() => 0))
            .take(limit.getOrElse(() => 100))
            .map(snd).toArray,
      ),
    );

  public create = (todo: CreateTodo): Kind<F, [Todo]> => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return this.F.do(function* (_) {
      const id = yield* _(self.nextId.updateAndGet(id => id + 1));
      const newTodo = yield* _(self.F.pure({ ...todo, id, completed: false }));
      yield* _(self.repo.update(repo => repo.insert(newTodo.id, newTodo)));
      return newTodo;
    });
  };

  public getById = (id: number): Kind<F, [Either<MessageFailure, Todo>]> =>
    pipe(
      this.repo.get(),
      this.F.map(repo =>
        repo
          .lookup(id)
          .toRight(() => new NotFoundFailure(`Todo with ID ${id} not found`)),
      ),
    );

  public markComplete = (id: number): Kind<F, [Either<MessageFailure, Todo>]> =>
    this.updateById(id, todo => ({ ...todo, completed: true }));

  public unMarkComplete = (
    id: number,
  ): Kind<F, [Either<MessageFailure, Todo>]> =>
    this.updateById(id, todo => ({ ...todo, completed: false }));

  public deleteById = (id: number): Kind<F, [void]> =>
    this.repo.update(repo => repo.remove(id));

  private updateById = (
    id: number,
    f: (todo: Todo) => Todo,
  ): Kind<F, [Either<MessageFailure, Todo>]> =>
    EitherT(this.getById(id)).map(this.F)(f).flatMapF(this.F)(todo =>
      this.repo.modify(repo => [repo.insert(todo.id, todo), Right(todo)]),
    ).value;
}
