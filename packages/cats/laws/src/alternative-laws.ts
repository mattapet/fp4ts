import { AnyK, Kind, pipe } from '@cats4ts/core';
import { Alternative } from '@cats4ts/cats-core';
import { IsEq } from '@cats4ts/cats-test-kit';

import { MonoidKLaws } from './monoid-k-laws';
import { ApplicativeLaws } from './applicative-laws';

export interface AlternativeLaws<F extends AnyK>
  extends ApplicativeLaws<F>,
    MonoidKLaws<F> {
  alternativeRightAbsorption: <A, B>(
    ff: Kind<F, [(a: A) => B]>,
  ) => IsEq<Kind<F, [B]>>;

  alternativeLeftDistributivity: <A, B>(
    fa: Kind<F, [A]>,
    fa2: Kind<F, [A]>,
    f: (a: A) => B,
  ) => IsEq<Kind<F, [B]>>;

  alternativeRightDistributivity: <A, B>(
    fa: Kind<F, [A]>,
    ff: Kind<F, [(a: A) => B]>,
    fg: Kind<F, [(a: A) => B]>,
  ) => IsEq<Kind<F, [A]>>;
}

export const AlternativeLaws = <F extends AnyK>(
  F: Alternative<F>,
): AlternativeLaws<F> => ({
  ...MonoidKLaws(F),
  ...ApplicativeLaws(F),

  alternativeRightAbsorption: <A, B>(
    ff: Kind<F, [(a: A) => B]>,
  ): IsEq<Kind<F, [B]>> => F.ap_(ff, F.emptyK())['<=>'](F.emptyK<B>()),

  alternativeLeftDistributivity: <A, B>(
    fa: Kind<F, [A]>,
    fa2: Kind<F, [A]>,
    f: (a: A) => B,
  ): IsEq<Kind<F, [B]>> =>
    pipe(
      F.combineK_(fa, () => fa2),
      F.map(f),
    )['<=>'](F.combineK_(F.map_(fa, f), () => F.map_(fa2, f))),

  alternativeRightDistributivity: <A, B>(
    fa: Kind<F, [A]>,
    ff: Kind<F, [(a: A) => B]>,
    fg: Kind<F, [(a: A) => B]>,
  ): IsEq<Kind<F, [A]>> =>
    pipe(
      F.combineK_(ff, () => fg),
      F.ap(fa),
    )['<=>'](F.combineK_(F.ap_(ff, fa), () => F.ap_(fg, fa))),
});
