// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Applicative, ApplicativeRequirements } from './applicative';
import { MonoidK, MonoidKRequirements } from './monoid-k';
import { List } from './data';

/**
 * @category Type Class
 */
export interface Alternative<F> extends Applicative<F>, MonoidK<F> {
  readonly many: <A>(fa: Kind<F, [A]>) => Kind<F, [List<A>]>;
  readonly many1: <A>(fa: Kind<F, [A]>) => Kind<F, [List<A>]>;

  readonly orElse: <A>(
    fb: () => Kind<F, [A]>,
  ) => (fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly orElse_: <A>(
    fa: Kind<F, [A]>,
    fb: () => Kind<F, [A]>,
  ) => Kind<F, [A]>;
}

export type AlternativeRequirements<F> = ApplicativeRequirements<F> &
  MonoidKRequirements<F> &
  Partial<Alternative<F>>;
export const Alternative = Object.freeze({
  of: <F>(F: AlternativeRequirements<F>): Alternative<F> => {
    const self: Alternative<F> = {
      many: <A>(fa: Kind<F, [A]>): Kind<F, [List<A>]> =>
        self.combineK_(self.many1(fa), () => self.pure(List.empty as List<A>)),

      many1: fa => self.map2_(fa, self.many(fa))((a, as) => as.prepend(a)),

      orElse: fb => fa => self.orElse_(fa, fb),
      orElse_: (fa, fb) => self.combineK_(fa, fb),

      ...MonoidK.of(F),
      ...Applicative.of(F),
      ...F,
    };
    return self;
  },
});
