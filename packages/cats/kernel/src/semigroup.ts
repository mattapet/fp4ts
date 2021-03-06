// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Lazy } from '@fp4ts/core';

/**
 * @category Type Class
 */
export interface Semigroup<S> {
  readonly combine: (y: Lazy<S>) => (x: S) => S;
  readonly combine_: (x: S, y: Lazy<S>) => S;
}

export type SemigroupRequirements<A> = Pick<Semigroup<A>, 'combine_'> &
  Partial<Semigroup<A>>;
export const Semigroup = Object.freeze({
  of: <A>(S: SemigroupRequirements<A>): Semigroup<A> => ({
    combine: y => x => S.combine_(x, y),
    ...S,
  }),

  get string(): Semigroup<string> {
    return Semigroup.of({ combine_: (x, y) => x + y() });
  },

  get disjunction(): Semigroup<boolean> {
    return Semigroup.of({ combine_: (x, y) => x || y() });
  },

  get conjunction(): Semigroup<boolean> {
    return Semigroup.of({ combine_: (x, y) => x && y() });
  },

  get addition(): Semigroup<number> {
    return Semigroup.of({ combine_: (x, y) => x + y() });
  },

  get product(): Semigroup<number> {
    return Semigroup.of({ combine_: (x, y) => x * y() });
  },

  first<A>(): Semigroup<A> {
    return Semigroup.of({ combine_: (x, y) => x });
  },
});
