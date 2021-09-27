import { TyK, _ } from '@cats4ts/core';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Alternative } from '../../alternative';
import { Functor } from '../../functor';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';

import { Either } from '../either';

import { Option as OptionBase } from './algebra';
import { fromEither, fromNullable, none, pure, some } from './constructors';
import {
  optionAlternative,
  optionApplicative,
  optionApply,
  optionEq,
  optionFlatMap,
  optionFunctor,
  optionMonad,
  optionMonoidK,
  optionSemigroupK,
} from './instances';
import { tailRecM } from './operators';
import { Eq } from '@cats4ts/cats-core';

// -- Object

export type Option<A> = OptionBase<A>;

export const Option: OptionObj = function <A>(
  x: A | null | undefined,
): Option<A> {
  return fromNullable(x);
} as any;

export const Some = some;
export const None = none;

export interface OptionObj {
  <A>(x: A | null | undefined): Option<A>;
  pure: <A>(x: A) => Option<A>;
  some: <A>(x: A) => Option<A>;
  none: Option<never>;
  fromEither: <A>(ea: Either<unknown, A>) => Option<A>;
  fromNullable: <A>(x: A | null | undefined) => Option<A>;

  tailRecM: <A>(a: A) => <B>(f: (a: A) => Option<Either<A, B>>) => Option<B>;

  // -- Instances

  readonly SemigroupK: SemigroupK<OptionK>;
  readonly MonoidK: MonoidK<OptionK>;
  readonly Functor: Functor<OptionK>;
  readonly Apply: Apply<OptionK>;
  readonly Applicative: Applicative<OptionK>;
  readonly Alternative: Alternative<OptionK>;
  readonly FlatMap: FlatMap<OptionK>;
  readonly Monad: Monad<OptionK>;
  Eq<A>(E: Eq<A>): Eq<Option<A>>;
}

Option.pure = pure;
Option.some = some;
Option.none = none;
Option.fromEither = fromEither;
Option.fromNullable = fromNullable;
Option.tailRecM = tailRecM;

Object.defineProperty(Option, 'SemigroupK', {
  get(): SemigroupK<OptionK> {
    return optionSemigroupK();
  },
});
Object.defineProperty(Option, 'MonoidK', {
  get(): MonoidK<OptionK> {
    return optionMonoidK();
  },
});
Object.defineProperty(Option, 'Functor', {
  get(): Functor<OptionK> {
    return optionFunctor();
  },
});
Object.defineProperty(Option, 'Apply', {
  get(): Apply<OptionK> {
    return optionApply();
  },
});
Object.defineProperty(Option, 'Applicative', {
  get(): Applicative<OptionK> {
    return optionApplicative();
  },
});
Object.defineProperty(Option, 'Alternative', {
  get(): Alternative<OptionK> {
    return optionAlternative();
  },
});
Object.defineProperty(Option, 'FlatMap', {
  get(): FlatMap<OptionK> {
    return optionFlatMap();
  },
});
Object.defineProperty(Option, 'Monad', {
  get(): Monad<OptionK> {
    return optionMonad();
  },
});
Option.Eq = optionEq;

// -- HKT

export const OptionURI = 'cats/data/option';
export type OptionURI = typeof OptionURI;
export type OptionK = TyK<OptionURI, [_]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [OptionURI]: Option<Tys[0]>;
  }
}