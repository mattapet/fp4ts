import { AnyK, Kind, pipe } from '@cats4ts/core';
import { Either, List, Option, Vector } from '@cats4ts/cats-core/lib/data';
import { Spawn } from '@cats4ts/effect-kernel';

import { Chunk } from '../chunk';
import { Pull } from '../pull';
import { Stream } from './algebra';
import { concat_, flatMap, repeat } from './operators';

export const pure = <F extends AnyK, A>(x: A): Stream<F, A> =>
  new Stream(Pull.output1(x));

export const empty = <F extends AnyK>(): Stream<F, never> =>
  new Stream(Pull.done());

export const defer = <F extends AnyK, A>(
  thunk: () => Stream<F, A>,
): Stream<F, A> => new Stream(Pull.defer(() => thunk().pull));

export const throwError: <F extends AnyK>(e: Error) => Stream<F, never> = e =>
  new Stream(Pull.throwError(e));

export const of = <F extends AnyK, A>(...xs: A[]): Stream<F, A> =>
  fromArray(xs);

export const evalF = <F extends AnyK, A>(fa: Kind<F, [A]>): Stream<F, A> =>
  new Stream(Pull.evalF(fa).flatMap(Pull.output1));

export const evalUnChunk = <F extends AnyK, A>(
  fa: Kind<F, [Chunk<A>]>,
): Stream<F, A> => new Stream(Pull.evalF(fa).flatMap(Pull.output));

export const repeatEval: <F extends AnyK, A>(fa: Kind<F, [A]>) => Stream<F, A> =
  s => repeat(evalF(s));

export const range = <F extends AnyK>(
  from: number,
  until: number,
  step: number = 1,
): Stream<F, number> => {
  const go = (i: number): Stream<F, number> =>
    i < until ? pure<F, number>(i)['+++'](defer(() => go(i + step))) : empty();

  return go(from);
};

export const never: <F extends AnyK>(F: Spawn<F, Error>) => Stream<F, never> =
  F => evalF(F.never);

export const fromArray = <F extends AnyK, A>(xs: A[]): Stream<F, A> => {
  switch (xs.length) {
    case 0:
      return empty();
    case 1:
      return pure(xs[0]);
    default:
      return new Stream(Pull.output(Chunk.fromArray(xs)));
  }
};

export const unfold =
  <S>(s: S) =>
  <F extends AnyK, A>(f: (s: S) => Option<[A, S]>): Stream<F, A> => {
    const loop = (s: S): Stream<F, A> =>
      f(s).fold(
        () => empty(),
        ([a, next]) =>
          concat_(
            pure(a),
            defer(() => loop(next)),
          ),
      );
    return loop(s);
  };

export const unfoldChunk =
  <S>(s: S) =>
  <F extends AnyK, A>(f: (s: S) => Option<[Chunk<A>, S]>): Stream<F, A> =>
    pipe(
      unfold(s)<F, Chunk<A>>(f),
      flatMap(x => fromChunk(x)),
    );

export const tailRecM: <S>(
  s: S,
) => <F extends AnyK, A>(f: (s: S) => Stream<F, Either<S, A>>) => Stream<F, A> =
  s => f => tailRecM_(s, f);

export const tailRecM_ = <F extends AnyK, S, A>(
  s: S,
  f: (s: S) => Stream<F, Either<S, A>>,
): Stream<F, A> =>
  pipe(
    f(s),
    flatMap(ea =>
      ea.fold(
        s => tailRecM_(s, f),
        a => pure(a),
      ),
    ),
  );

export const fromList = <F extends AnyK, A>(xs: List<A>): Stream<F, A> =>
  fromArray(xs.toArray);

export const fromVector = <F extends AnyK, A>(xs: Vector<A>): Stream<F, A> =>
  fromArray(xs.toArray);

export const fromChunk = <F extends AnyK, A>(chunk: Chunk<A>): Stream<F, A> =>
  new Stream(Pull.output(chunk));