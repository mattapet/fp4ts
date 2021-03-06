// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, TyK, TyVar } from '@fp4ts/core';
import { EqK } from '../../eq-k';
import { Distributive } from '../../distributive';
import { Applicative } from '../../applicative';
import { Apply } from '../../apply';
import { FlatMap } from '../../flat-map';
import { CoflatMap } from '../../coflat-map';
import { Functor } from '../../functor';
import { Monad } from '../../monad';
import { Comonad } from '../../comonad';
import { Foldable } from '../../foldable';
import { Traversable } from '../../traversable';

import { Either } from '../either';

import { pure } from './constructors';
import {
  identityApplicative,
  identityApply,
  identityCoflatMap,
  identityComonad,
  identityDistributive,
  identityEqK,
  identityFlatMap,
  identityFoldable,
  identityFunctor,
  identityMonad,
  identityTraversable,
} from './instances';
import { tailRecM } from './operators';

export type Identity<A> = A;

export const Identity: IdentityObj = function <A>(a: A): Identity<A> {
  return pure(a);
} as any;

interface IdentityObj {
  <A>(a: A): Identity<A>;
  pure<A>(a: A): Identity<A>;
  unit: Identity<void>;
  tailRecM: <A>(
    a: A,
  ) => <B>(f: (a: A) => Identity<Either<A, B>>) => Identity<B>;

  readonly EqK: EqK<IdentityF>;
  readonly Functor: Functor<IdentityF>;
  readonly Distributive: Distributive<IdentityF>;
  readonly Apply: Apply<IdentityF>;
  readonly Applicative: Applicative<IdentityF>;
  readonly FlatMap: FlatMap<IdentityF>;
  readonly CoflatMap: CoflatMap<IdentityF>;
  readonly Monad: Monad<IdentityF>;
  readonly Comonad: Comonad<IdentityF>;
  readonly Foldable: Foldable<IdentityF>;
  readonly Traversable: Traversable<IdentityF>;
}

Identity.pure = pure;
Identity.unit = pure(undefined);
Identity.tailRecM = tailRecM;

// -- Instances

Object.defineProperty(Identity, 'EqK', {
  get(): EqK<IdentityF> {
    return identityEqK();
  },
});
Object.defineProperty(Identity, 'Functor', {
  get(): Functor<IdentityF> {
    return identityFunctor();
  },
});
Object.defineProperty(Identity, 'Distributive', {
  get(): Distributive<IdentityF> {
    return identityDistributive();
  },
});
Object.defineProperty(Identity, 'Apply', {
  get(): Apply<IdentityF> {
    return identityApply();
  },
});
Object.defineProperty(Identity, 'Applicative', {
  get(): Applicative<IdentityF> {
    return identityApplicative();
  },
});
Object.defineProperty(Identity, 'FlatMap', {
  get(): FlatMap<IdentityF> {
    return identityFlatMap();
  },
});
Object.defineProperty(Identity, 'CoflatMap', {
  get(): CoflatMap<IdentityF> {
    return identityCoflatMap();
  },
});
Object.defineProperty(Identity, 'Monad', {
  get(): Monad<IdentityF> {
    return identityMonad();
  },
});
Object.defineProperty(Identity, 'Comonad', {
  get(): Comonad<IdentityF> {
    return identityComonad();
  },
});
Object.defineProperty(Identity, 'Foldable', {
  get(): Foldable<IdentityF> {
    return identityFoldable();
  },
});
Object.defineProperty(Identity, 'Traversable', {
  get(): Traversable<IdentityF> {
    return identityTraversable();
  },
});

// HKT

/**
 * @category Type Constructor
 * @category Data
 */
export interface IdentityF extends TyK<[unknown]> {
  [$type]: TyVar<this, 0>;
}
