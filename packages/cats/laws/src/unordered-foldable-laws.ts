import { AnyK, id, Kind } from '@cats4ts/core';
import { Monoid, UnorderedFoldable } from '@cats4ts/cats-core';
import { IsEq } from '@cats4ts/cats-test-kit';

export interface UnorderedFoldableLaws<F extends AnyK> {
  unorderedFoldConsistentWithUnorderedFoldMap: <A>(
    fa: Kind<F, [A]>,
    M: Monoid<A>,
  ) => IsEq<A>;

  allConsistentWithAny: <A>(fa: Kind<F, [A]>, p: (a: A) => boolean) => boolean;

  anyLazy: <A>(fa: Kind<F, [A]>) => boolean;

  allLazy: <A>(fa: Kind<F, [A]>) => boolean;

  allEmpty: <A>(fa: Kind<F, [A]>, p: (a: A) => boolean) => boolean;

  nonEmptyRef: <A>(fa: Kind<F, [A]>) => IsEq<boolean>;
}

export const UnorderedFoldableLaws = <F extends AnyK>(
  F: UnorderedFoldable<F>,
): UnorderedFoldableLaws<F> => ({
  unorderedFoldConsistentWithUnorderedFoldMap: <A>(
    fa: Kind<F, [A]>,
    M: Monoid<A>,
  ): IsEq<A> =>
    new IsEq(F.unorderedFoldMap_(M)(fa, id), F.unorderedFold(M)(fa)),

  allConsistentWithAny: <A>(
    fa: Kind<F, [A]>,
    p: (a: A) => boolean,
  ): boolean => {
    if (!F.all_(fa, p)) return true;

    const negationExists = F.any_(fa, x => !p(x));
    return !negationExists && (F.isEmpty(fa) || F.any_(fa, p));
  },

  anyLazy: <A>(fa: Kind<F, [A]>): boolean => {
    let i = 0;
    F.any_(fa, () => {
      i += 1;
      return true;
    });
    return F.isEmpty(fa) ? i === 0 : i === 1;
  },

  allLazy: <A>(fa: Kind<F, [A]>): boolean => {
    let i = 0;
    F.all_(fa, () => {
      i += 1;
      return false;
    });
    return F.isEmpty(fa) ? i === 0 : i === 1;
  },

  allEmpty: <A>(fa: Kind<F, [A]>, p: (a: A) => boolean): boolean =>
    !F.isEmpty(fa) || F.all_(fa, p),

  nonEmptyRef: <A>(fa: Kind<F, [A]>): IsEq<boolean> =>
    new IsEq(F.nonEmpty(fa), !F.isEmpty(fa)),
});
