import { AnyK, id, Kind } from '@cats4ts/core';
import { FunctorFilter } from '@cats4ts/cats-core';
import { None, Option, Some } from '@cats4ts/cats-core/lib/data';
import { IsEq } from '@cats4ts/cats-test-kit';

import { FunctorLaws } from './functor-laws';

export interface FunctorFilterLaws<F extends AnyK> extends FunctorLaws<F> {
  mapFilterComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f: (a: A) => Option<B>,
    g: (b: B) => Option<C>,
  ) => IsEq<Kind<F, [B]>>;

  mapFilterMapConsistency: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
  ) => IsEq<Kind<F, [A]>>;

  collectConsistentWithMapFilter: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Option<B>,
  ) => IsEq<Kind<F, [B]>>;

  flattenOptionConsistentWithMapFilter: <A>(
    ffa: Kind<F, [Option<A>]>,
  ) => IsEq<Kind<F, [A]>>;

  filterConsistentWithMapFilter: <A>(
    fa: Kind<F, [A]>,
    p: (a: A) => boolean,
  ) => IsEq<Kind<F, [A]>>;

  filterNotConsistentWithFilter: <A>(
    fa: Kind<F, [A]>,
    p: (a: A) => boolean,
  ) => IsEq<Kind<F, [A]>>;
}

export const FunctorFilterLaws = <F extends AnyK>(
  F: FunctorFilter<F>,
): FunctorFilterLaws<F> => ({
  ...FunctorLaws(F),

  mapFilterComposition: <A, B, C>(
    fa: Kind<F, [A]>,
    f: (a: A) => Option<B>,
    g: (b: B) => Option<C>,
  ): IsEq<Kind<F, [B]>> => {
    const lhs = F.mapFilter_(F.mapFilter_(fa, f), g);
    const rhs = F.mapFilter_(fa, a => f(a).flatMap(g));
    return lhs['<=>'](rhs);
  },

  mapFilterMapConsistency: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => B,
  ): IsEq<Kind<F, [A]>> =>
    F.mapFilter_(fa, a => Some(f(a)))['<=>'](F.map_(fa, f)),

  collectConsistentWithMapFilter: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Option<B>,
  ): IsEq<Kind<F, [B]>> => F.collect_(fa, f)['<=>'](F.mapFilter_(fa, f)),

  flattenOptionConsistentWithMapFilter: <A>(
    ffa: Kind<F, [Option<A>]>,
  ): IsEq<Kind<F, [A]>> => F.flattenOption(ffa)['<=>'](F.mapFilter_(ffa, id)),

  filterConsistentWithMapFilter: <A>(
    fa: Kind<F, [A]>,
    p: (a: A) => boolean,
  ): IsEq<Kind<F, [A]>> =>
    F.filter_(fa, p)['<=>'](F.mapFilter_(fa, a => (p(a) ? Some(a) : None))),

  filterNotConsistentWithFilter: <A>(
    fa: Kind<F, [A]>,
    p: (a: A) => boolean,
  ): IsEq<Kind<F, [A]>> =>
    F.filterNot_(fa, p)['<=>'](F.filter_(fa, a => !p(a))),
});