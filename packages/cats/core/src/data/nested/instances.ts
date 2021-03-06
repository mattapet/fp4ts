// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Functor } from '../../functor';
import { Applicative } from '../../applicative';
import { Nested } from './algebra';
import { NestedF } from './nested';

export const nestedEq = <F, G, A>(
  EFGA: Eq<Kind<F, [Kind<G, [A]>]>>,
): Eq<Nested<F, G, A>> =>
  Eq.by<Nested<F, G, A>, Kind<F, [Kind<G, [A]>]>>(EFGA, x => x.value);

export const nestedFunctor: <F, G>(
  F: Functor<F>,
  G: Functor<G>,
) => Functor<$<NestedF, [F, G]>> = <F, G>(
  F: Functor<F>,
  G: Functor<G>,
): Functor<$<NestedF, [F, G]>> => {
  const FG = Functor.compose(F, G);
  return Functor.of({ map_: (fa, f) => new Nested(FG.map_(fa.value, f)) });
};

export const nestedApplicative: <F, G>(
  F: Applicative<F>,
  G: Applicative<G>,
) => Applicative<$<NestedF, [F, G]>> = <F, G>(
  F: Applicative<F>,
  G: Applicative<G>,
): Applicative<$<NestedF, [F, G]>> => {
  const FG = Applicative.compose(F, G);
  return Applicative.of({
    ap_: (ff, fa) => new Nested(FG.ap_(ff.value, fa.value)),
    pure: a => new Nested(FG.pure(a)),
  });
};
