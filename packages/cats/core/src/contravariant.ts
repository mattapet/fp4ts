// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Invariant } from './invariant';

/**
 * @category Type Class
 */
export interface Contravariant<F> extends Invariant<F> {
  readonly contramap: <A, B>(
    f: (b: B) => A,
  ) => (fa: Kind<F, [A]>) => Kind<F, [B]>;
  readonly contramap_: <A, B>(fa: Kind<F, [A]>, f: (b: B) => A) => Kind<F, [B]>;

  readonly narrow: <A, B extends A>(fa: Kind<F, [A]>) => Kind<F, [B]>;

  readonly liftContravariant: <A, B>(
    f: (b: A) => B,
  ) => (fb: Kind<F, [B]>) => Kind<F, [A]>;
}

export type ContravariantRequirements<F> = Pick<
  Contravariant<F>,
  'contramap_'
> &
  Partial<Contravariant<F>>;

export const Contravariant = Object.freeze({
  of: <F>(F: ContravariantRequirements<F>): Contravariant<F> => {
    const self: Contravariant<F> = {
      contramap: f => fa => self.contramap_(fa, f),

      narrow: (<A, B extends A>(fa: Kind<F, [A]>): Kind<F, [B]> =>
        fa as Kind<F, [B]>) as Contravariant<F>['narrow'],

      liftContravariant: f => fb => self.contramap_(fb, f),

      ...Invariant.of({ imap_: (fa, f, g) => self.contramap_(fa, g) }),
      ...F,
    };
    return self;
  },
});
