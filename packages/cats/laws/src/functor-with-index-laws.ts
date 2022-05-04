import { Kind, pipe } from '@fp4ts/core';
import { FunctorWithIndex } from '@fp4ts/cats-core';
import { IsEq } from '@fp4ts/cats-test-kit';
import { FunctorLaws } from './functor-laws';

export const FunctorWithIndexLaws = <F, I>(F: FunctorWithIndex<F, I>) => ({
  ...FunctorLaws(F),

  indexedCovariantIdentity: <A>(fa: Kind<F, [A]>): IsEq<Kind<F, [A]>> =>
    new IsEq(
      F.mapWithIndex_(fa, (a, i) => a),
      fa,
    ),

  indexedCovariantComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f: (a: A, i: I) => B,
    g: (b: B, i: I) => C,
  ): IsEq<Kind<F, [C]>> => {
    const lhs = pipe(fa, F.mapWithIndex(f), F.mapWithIndex(g));
    const rhs = F.mapWithIndex_(fa, (a, i) => g(f(a, i), i));
    return new IsEq(lhs, rhs);
  },
});
