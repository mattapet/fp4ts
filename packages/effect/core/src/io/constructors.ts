import { AnyK, flow, Kind } from '@cats4ts/core';
import { Either, Left, None, Option, Right, FunctionK } from '@cats4ts/cats';
import { ExecutionContext, Poll, MonadCancel } from '@cats4ts/effect-kernel';

import {
  Canceled,
  CurrentTimeMillis,
  Defer,
  Delay,
  Fail,
  IO,
  Pure,
  ReadEC,
  Sleep,
  Uncancelable,
  IOCont,
  Suspend,
} from './algebra';
import { flatMap_ } from './operators';
import { IoK } from './io';

export const pure: <A>(a: A) => IO<A> = value => new Pure(value);

export const unit: IO<void> = pure(undefined);

export const delay: <A>(thunk: () => A) => IO<A> = thunk => new Delay(thunk);

export const defer: <A>(thunk: () => IO<A>) => IO<A> = thunk =>
  new Defer(thunk);

export const throwError: (error: Error) => IO<never> = error => new Fail(error);

export const currentTimeMillis: IO<number> = CurrentTimeMillis;

export const readExecutionContext: IO<ExecutionContext> = ReadEC;

export const async = <A>(
  k: (cb: (ea: Either<Error, A>) => void) => IO<Option<IO<void>>>,
): IO<A> =>
  new IOCont(
    <G extends AnyK>(G: MonadCancel<G, Error>) =>
      (resume, get: Kind<G, [A]>, lift: FunctionK<IoK, G>) =>
        G.uncancelable(poll =>
          G.flatMap_(lift(k(resume)), opt =>
            opt.fold(
              () => poll(get),
              fin => G.onCancel_(poll(get), lift(fin)),
            ),
          ),
        ),
  );

export const async_ = <A>(
  k: (cb: (ea: Either<Error, A>) => void) => IO<void>,
): IO<A> =>
  new IOCont(
    <G extends AnyK>(G: MonadCancel<G, Error>) =>
      (resume, get: Kind<G, [A]>, lift: FunctionK<IoK, G>) =>
        G.uncancelable(poll => G.flatMap_(lift(k(resume)), () => poll(get))),
  );

export const never: IO<never> = async(() => pure(None));

export const canceled: IO<void> = Canceled;

export const suspend: IO<void> = Suspend;

export const uncancelable: <A>(ioa: (p: Poll<IoK>) => IO<A>) => IO<A> = ioa =>
  new Uncancelable(ioa);

export const sleep = (ms: number): IO<void> => new Sleep(ms);

export const deferPromise = <A>(thunk: () => Promise<A>): IO<A> =>
  async_(resume =>
    delay(() => {
      const onSuccess: (x: A) => void = flow(Right, resume);
      const onFailure: (e: Error) => void = flow(Left, resume);
      thunk().then(onSuccess, onFailure);
    }),
  );

export const fromPromise = <A>(iop: IO<Promise<A>>): IO<A> =>
  flatMap_(iop, p =>
    async_(resume =>
      delay(() => {
        const onSuccess: (x: A) => void = flow(Right, resume);
        const onFailure: (e: Error) => void = flow(Left, resume);
        p.then(onSuccess, onFailure);
      }),
    ),
  );
