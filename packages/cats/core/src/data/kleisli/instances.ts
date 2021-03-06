// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, cached, Fix, Kind, α, λ } from '@fp4ts/core';
import { Defer } from '../../defer';
import { SemigroupK } from '../../semigroup-k';
import { MonoidK } from '../../monoid-k';
import { Contravariant } from '../../contravariant';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Apply } from '../../apply';
import { Applicative } from '../../applicative';
import { Alternative } from '../../alternative';
import { ApplicativeError } from '../../applicative-error';
import { FlatMap } from '../../flat-map';
import { Monad } from '../../monad';
import { MonadError } from '../../monad-error';
import { Distributive } from '../../distributive';
import { Arrow, ArrowApply, ArrowChoice } from '../../arrow';

import { Kleisli } from './algebra';
import type { KleisliF } from './kleisli';
import {
  adapt_,
  ap_,
  compose_,
  flatMap_,
  map2_,
  map_,
  productL_,
  productR_,
  product_,
  tailRecM_,
} from './operators';
import { liftF, of, pure, suspend } from './constructors';
import { Either, Left, Right } from '../either';

export const kleisliDefer: <F, A>(
  F: Defer<F>,
) => Defer<$<KleisliF, [F, A]>> = F =>
  Defer.of({ defer: fa => new Kleisli(r => F.defer(() => fa().run(r))) });

export const kleisliSemigroupK: <F, A>(
  F: SemigroupK<F>,
) => SemigroupK<$<KleisliF, [F, A]>> = <F, A>(F: SemigroupK<F>) =>
  SemigroupK.of<$<KleisliF, [F, A]>>({
    combineK_: <B>(x: Kleisli<F, A, B>, y: () => Kleisli<F, A, B>) =>
      suspend((a: A) => F.combineK_<B>(x.run(a), () => y().run(a))),
  });

export const kleisliMonoidK: <F, A>(
  F: MonoidK<F>,
) => MonoidK<$<KleisliF, [F, A]>> = <F, A>(F: MonoidK<F>) =>
  MonoidK.of<$<KleisliF, [F, A]>>({
    combineK_: <B>(x: Kleisli<F, A, B>, y: () => Kleisli<F, A, B>) =>
      suspend((a: A) => F.combineK_<B>(x.run(a), () => y().run(a))),

    emptyK: () => liftF(F.emptyK()),
  });

export const kleisliContravariant: <F, B>() => Contravariant<
  λ<KleisliF, [Fix<F>, α, Fix<B>]>
> = () =>
  Contravariant.of({
    contramap_: (fa, f) => adapt_(fa, f) as any,
  });

export const kleisliFunctor: <F, A>(
  F: Functor<F>,
) => Functor<$<KleisliF, [F, A]>> = F =>
  Functor.of({
    map_: map_(F),
  });

export const kleisliFunctorFilter: <F, A>(
  F: FunctorFilter<F>,
) => FunctorFilter<$<KleisliF, [F, A]>> = F =>
  FunctorFilter.of({
    ...kleisliFunctor(F),
    mapFilter_: (fa, f) => suspend(a => F.mapFilter_(fa.run(a), f)),
  });

export const kleisliDistributive = <F, R>(
  F: Distributive<F>,
): Distributive<$<KleisliF, [F, R]>> =>
  Distributive.of({
    ...kleisliFunctor(F),

    distribute_:
      <G>(G: Functor<G>) =>
      <A, B>(ga: Kind<G, [A]>, f: (a: A) => Kleisli<F, R, B>) =>
        of((r: R) => F.distribute_(G)(ga, (a: A) => f(a).run(r))),
  });

export const kleisliApply: <F, A>(
  F: Apply<F>,
) => Apply<$<KleisliF, [F, A]>> = F =>
  Apply.of({
    ...kleisliFunctor(F),
    ap_: ap_(F),
    map2_: map2_(F),
    product_: product_(F),
    productL_: productL_(F),
    productR_: productR_(F),
  });

export const kleisliApplicative: <F, A>(
  F: Applicative<F>,
) => Applicative<$<KleisliF, [F, A]>> = (() => {
  const cache = new Map<any, Applicative<any>>();
  return <F>(F: Applicative<F>) => {
    if (cache.has(F)) {
      return cache.get(F)!;
    }
    const instance = Applicative.of({
      ...kleisliFunctor(F),
      ...kleisliApply(F),
      pure: pure(F),
    });
    cache.set(F, instance);
    return instance as Applicative<any>;
  };
})();

export const kleisliAlternative: <F, A>(
  F: Alternative<F>,
) => Alternative<$<KleisliF, [F, A]>> = cached(F =>
  Alternative.of({
    ...kleisliMonoidK(F),
    ...kleisliApplicative(F),
  }),
);

export const kleisliApplicativeError: <F, A, E>(
  F: ApplicativeError<F, E>,
) => ApplicativeError<$<KleisliF, [F, A]>, E> = <F, A, E>(
  F: ApplicativeError<F, E>,
) =>
  ApplicativeError.of<$<KleisliF, [F, A]>, E>({
    ...kleisliApplicative(F),
    throwError: <B>(e: E) => liftF(F.throwError<B>(e)),
    handleErrorWith_: (fa, f) =>
      suspend((a: A) => F.handleErrorWith_(fa.run(a), e => f(e).run(a))),
  });

export const kleisliFlatMap: <F, A>(
  F: Monad<F>,
) => FlatMap<$<KleisliF, [F, A]>> = F =>
  FlatMap.of({
    ...kleisliApply(F),
    flatMap_: flatMap_(F),
    tailRecM_: tailRecM_(F),
  });

export const kleisliMonad: <F, A>(F: Monad<F>) => Monad<$<KleisliF, [F, A]>> =
  (() => {
    const cache = new Map<any, Monad<any>>();
    return <F>(F: Monad<F>) => {
      if (cache.has(F)) {
        return cache.get(F)!;
      }
      const instance = Monad.of({
        ...kleisliApplicative(F),
        ...kleisliFlatMap(F),
      });
      cache.set(F, instance);
      return instance as Monad<any>;
    };
  })();

export const kleisliMonadError: <F, A, E>(
  F: MonadError<F, E>,
) => MonadError<$<KleisliF, [F, A]>, E> = F =>
  MonadError.of({
    ...kleisliMonad(F),
    ...kleisliApplicativeError(F),
  });

export const kleisliArrow = <F>(F: Monad<F>): Arrow<$<KleisliF, [F]>> =>
  Arrow.of({
    lift: <A, B>(f: (a: A) => B) => of((a: A) => F.pure(f(a))),
    first:
      <C>() =>
      <A, B>(k: Kleisli<F, A, B>) =>
        of(([a, c]: [A, C]) => F.map_(k.run(a), b => [b, c])),
    compose_: compose_(F),
  });

export const kleisliArrowApply = <F>(
  F: Monad<F>,
): ArrowApply<$<KleisliF, [F]>> =>
  ArrowApply.of<$<KleisliF, [F]>>({
    ...kleisliArrow(F),
    app: <A, B>() => of(([fab, a]: [Kleisli<F, A, B>, A]) => fab.run(a)),
  });

export const kleisliArrowChoice = <F>(
  F: Monad<F>,
): ArrowChoice<$<KleisliF, [F]>> =>
  ArrowChoice.of({
    ...kleisliArrow(F),
    choose: <A, B, C, D>(fac: Kleisli<F, A, C>, fbd: Kleisli<F, B, D>) =>
      of(
        (ab: Either<A, B>): Kind<F, [Either<C, D>]> =>
          ab.fold(
            a => F.map_(fac.run(a), c => Left(c)),
            b => F.map_(fbd.run(b), d => Right(d)),
          ),
      ),
  });
