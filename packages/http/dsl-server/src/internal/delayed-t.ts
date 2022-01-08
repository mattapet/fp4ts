import { $ } from '@fp4ts/core';
import { EitherT, EitherTK, Monad, ReaderT } from '@fp4ts/cats';
import { MessageFailure, Request } from '@fp4ts/http-core';

export type DelayedT<F, A> = ReaderT<
  $<EitherTK, [F, MessageFailure]>,
  Request<F>,
  A
>;

export const DelayedT = Object.freeze({
  withRequest: <F>(
    F: Monad<F>,
  ): (<A>(f: (req: Request<F>) => DelayedT<F, A>) => DelayedT<F, A>) => {
    const RF = EitherT.Monad<F, MessageFailure>(F);
    return <A>(f: (req: Request<F>) => DelayedT<F, A>): DelayedT<F, A> =>
      ReaderT.ask<$<EitherTK, [F, MessageFailure]>, Request<F>>(RF).flatMap(RF)(
        x => f(x),
      );
  },
});
