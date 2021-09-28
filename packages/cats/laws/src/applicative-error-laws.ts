import { AnyK, Kind, pipe } from '@cats4ts/core';
import { ApplicativeError } from '@cats4ts/cats-core';
import { Either, Left, Right } from '@cats4ts/cats-core/lib/data';
import { IsEq } from '@cats4ts/cats-test-kit';

import { ApplicativeLaws } from './applicative-laws';

export const ApplicativeErrorLaws = <F extends AnyK, E>(
  F: ApplicativeError<F, E>,
): ApplicativeErrorLaws<F, E> => ({
  ...ApplicativeLaws(F),

  applicativeErrorHandleWith: <A>(
    e: E,
    h: (e: E) => Kind<F, [A]>,
  ): IsEq<Kind<F, [A]>> =>
    F.handleErrorWith_(F.throwError<A>(e), h)['<=>'](h(e)),

  handleErrorWithPure: <A>(
    a: A,
    h: (e: E) => Kind<F, [A]>,
  ): IsEq<Kind<F, [A]>> => F.handleErrorWith_(F.pure(a), h)['<=>'](F.pure(a)),

  handleErrorThrow: <A>(e: E, h: (e: E) => A): IsEq<Kind<F, [A]>> =>
    F.handleError_(F.throwError<A>(e), h)['<=>'](F.pure(h(e))),

  handleErrorPure: <A>(a: A, h: (e: E) => A): IsEq<Kind<F, [A]>> =>
    F.handleError_(F.pure(a), h)['<=>'](F.pure(a)),

  throwErrorAttempt: (e: E): IsEq<Kind<F, [Either<E, void>]>> =>
    F.attempt(F.throwError(e))['<=>'](F.pure(Left(e))),

  pureAttempt: <A>(a: A): IsEq<Kind<F, [Either<E, A>]>> =>
    F.attempt(F.pure(a))['<=>'](F.pure(Right(a))),

  attemptFromEitherConsistentWithPure: <A>(
    ea: Either<E, A>,
  ): IsEq<Kind<F, [Either<E, A>]>> =>
    F.attempt(F.fromEither(ea))['<=>'](F.pure(ea)),

  onErrorPure: <A>(a: A, f: (e: E) => Kind<F, [void]>): IsEq<Kind<F, [A]>> =>
    F.onError_(F.pure(a), f)['<=>'](F.pure(a)),

  onErrorThrow: <A>(
    fa: Kind<F, [A]>,
    e: E,
    fb: Kind<F, [void]>,
  ): IsEq<Kind<F, [A]>> =>
    F.onError_(F.throwError<A>(e), () => fb)['<=>'](
      F.map2_(fb, F.throwError<A>(e))((_, b) => b),
    ),

  redeemDerivedFromAttemptMap: <A, B>(
    fa: Kind<F, [A]>,
    h: (e: E) => B,
    f: (a: A) => B,
  ): IsEq<Kind<F, [B]>> =>
    F.redeem_(fa, h, f)['<=>'](F.map_(F.attempt(fa), ea => ea.fold(h, f))),

  throwErrorDistributesOverApLeft: <A>(
    e: E,
    h: (e: E) => Kind<F, [A]>,
  ): IsEq<Kind<F, [A]>> =>
    pipe(F.throwError<(_: void) => A>(e), F.ap(F.unit), F.handleErrorWith(h))[
      '<=>'
    ](h(e)),

  throwErrorDistributesOverApRight: <A>(
    e: E,
    h: (e: E) => Kind<F, [A]>,
  ): IsEq<Kind<F, [A]>> =>
    pipe(
      F.pure((a: A) => a),
      F.ap(F.throwError<A>(e)),
      F.handleErrorWith(h),
    )['<=>'](h(e)),
});

export interface ApplicativeErrorLaws<F extends AnyK, E>
  extends ApplicativeLaws<F> {
  applicativeErrorHandleWith: <A>(
    e: E,
    h: (e: E) => Kind<F, [A]>,
  ) => IsEq<Kind<F, [A]>>;

  handleErrorWithPure: <A>(
    a: A,
    h: (e: E) => Kind<F, [A]>,
  ) => IsEq<Kind<F, [A]>>;

  handleErrorThrow: <A>(e: E, h: (e: E) => A) => IsEq<Kind<F, [A]>>;

  handleErrorPure: <A>(a: A, h: (e: E) => A) => IsEq<Kind<F, [A]>>;

  throwErrorAttempt: (e: E) => IsEq<Kind<F, [Either<E, void>]>>;

  pureAttempt: <A>(a: A) => IsEq<Kind<F, [Either<E, A>]>>;

  attemptFromEitherConsistentWithPure: <A>(
    ea: Either<E, A>,
  ) => IsEq<Kind<F, [Either<E, A>]>>;

  onErrorPure: <A>(a: A, f: (e: E) => Kind<F, [void]>) => IsEq<Kind<F, [A]>>;

  onErrorThrow: <A>(
    fa: Kind<F, [A]>,
    e: E,
    fb: Kind<F, [void]>,
  ) => IsEq<Kind<F, [A]>>;

  redeemDerivedFromAttemptMap: <A, B>(
    fa: Kind<F, [A]>,
    h: (e: E) => B,
    f: (a: A) => B,
  ) => IsEq<Kind<F, [B]>>;

  throwErrorDistributesOverApLeft: <A>(
    e: E,
    h: (e: E) => Kind<F, [A]>,
  ) => IsEq<Kind<F, [A]>>;

  throwErrorDistributesOverApRight: <A>(
    e: E,
    h: (e: E) => Kind<F, [A]>,
  ) => IsEq<Kind<F, [A]>>;
}
