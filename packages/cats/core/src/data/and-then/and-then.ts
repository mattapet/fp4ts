// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, $type, Fix, TyK, TyVar, α, λ } from '@fp4ts/core';
import { Contravariant } from '../../contravariant';
import { ArrowChoice } from '../../arrow';
import { Monad } from '../../monad';
import { AndThen as AndThenBase } from './algebra';
import { identity, lift, pure } from './constructors';
import {
  andThenArrowChoice,
  andThenContravariant,
  andThenMonad,
} from './instances';

export type AndThen<A, B> = AndThenBase<A, B>;

export const AndThen: AndThenObj = function <A, B>(f: (a: A) => B) {
  return lift(f);
} as any;

interface AndThenObj {
  <A, B>(f: (a: A) => B): AndThen<A, B>;
  pure<A, B>(b: B): AndThen<A, B>;
  lift<A, B>(f: (a: A) => B): AndThen<A, B>;
  identity<A>(): AndThen<A, A>;

  // -- Instances

  Contravariant<B>(): Contravariant<λ<AndThenK, [α, Fix<B>]>>;
  Monad<A>(): Monad<$<AndThenK, [A]>>;
  readonly ArrowChoice: ArrowChoice<AndThenK>;
}

AndThen.pure = pure;
AndThen.lift = lift;
AndThen.identity = identity;

AndThen.Contravariant = andThenContravariant;
AndThen.Monad = andThenMonad;
Object.defineProperty(AndThen, 'ArrowChoice', {
  get(): ArrowChoice<AndThenK> {
    return andThenArrowChoice();
  },
});

// -- HKT

export interface AndThenK extends TyK<[unknown, unknown]> {
  [$type]: AndThen<TyVar<this, 0>, TyVar<this, 1>>;
}