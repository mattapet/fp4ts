// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Arrow } from '@fp4ts/cats-core';
import { exec, ExhaustiveCheck, forAll, RuleSet } from '@fp4ts/cats-test-kit';

import { ArrowLaws } from '../arrow-laws';
import { StrongSuite } from './strong-suite';
import { CategorySuite } from './category-suite';

export const ArrowSuite = <F>(F: Arrow<F>) => {
  const laws = ArrowLaws(F);

  const self = {
    ...StrongSuite(F),
    ...CategorySuite(F),

    arrow: <A, B, C, D, B1, B2>(
      arbA: Arbitrary<A>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      arbD: Arbitrary<D>,
      arbB1: Arbitrary<B1>,
      arbB2: Arbitrary<B2>,
      EqA: Eq<A>,
      EcA: ExhaustiveCheck<A>,
      EqB: Eq<B>,
      EqC: Eq<C>,
      EcC: ExhaustiveCheck<C>,
      EqD: Eq<D>,
      EcD: ExhaustiveCheck<D>,
      EqB2: Eq<B2>,
      mkArbF: <X, Y>(
        arbX: Arbitrary<X>,
        arbY: Arbitrary<Y>,
      ) => Arbitrary<Kind<F, [X, Y]>>,
      mkEqF: <X, Y>(EqX: ExhaustiveCheck<X>, EqY: Eq<Y>) => Eq<Kind<F, [X, Y]>>,
    ) =>
      new RuleSet(
        'Arrow',
        [
          ['arrow identity', exec(laws.arrowIdentity<A>())(mkEqF(EcA, EqA))],
          [
            'arrow composition',
            forAll(
              fc.func<[A], B>(arbB),
              fc.func<[B], C>(arbC),
              laws.arrowComposition,
            )(mkEqF(EcA, EqC)),
          ],
          [
            'arrow extension',
            forAll(
              fc.func<[A], B>(arbB),
              laws.arrowExtension<C>(),
            )(mkEqF(EcA.product(EcC), Eq.tuple(EqB, EqC))),
          ],
          [
            'arrow functor',
            forAll(
              mkArbF(arbA, arbB),
              mkArbF(arbB, arbC),
              laws.arrowFunctor<D>(),
            )(mkEqF(EcA.product(EcD), Eq.tuple(EqC, EqD))),
          ],
          [
            'arrow exchange',
            forAll(
              mkArbF(arbA, arbB),
              fc.func<[C], D>(arbD),
              laws.arrowExchange,
            )(mkEqF(EcA.product(EcC), Eq.tuple(EqB, EqD))),
          ],
          [
            'arrow unit',
            forAll(
              mkArbF(arbA, arbB),
              laws.arrowUnit<C>(),
            )(mkEqF(EcA.product(EcC), EqB)),
          ],
          [
            'arrow association',
            forAll(
              mkArbF(arbA, arbB),
              laws.arrowAssociation<C, D>(),
            )(
              mkEqF(
                EcA.product(EcC).product(EcD),
                Eq.tuple(EqB, Eq.tuple(EqC, EqD)),
              ),
            ),
          ],
          [
            'arrow split consistent with andThen',
            forAll(
              mkArbF(arbA, arbB),
              mkArbF(arbC, arbD),
              laws.splitConsistentWithAndThen,
            )(mkEqF(EcA.product(EcC), Eq.tuple(EqB, EqD))),
          ],
          [
            'arrow merge consistent with andThen',
            forAll(
              mkArbF(arbA, arbB),
              mkArbF(arbA, arbC),
              laws.mergeConsistentWithAndThen,
            )(mkEqF(EcA, Eq.tuple(EqB, EqC))),
          ],
        ],
        {
          parents: [
            self.category(arbA, arbB, arbC, arbD, EcA, EqB, EqD, mkArbF, mkEqF),
            self.strong(
              arbA,
              arbB,
              arbC,
              arbD,
              arbB1,
              arbB2,
              EcA,
              EqB,
              EqC,
              EcC,
              EqD,
              EcD,
              EqB2,
              mkArbF,
              mkEqF,
            ),
          ],
        },
      ),
  };

  return self;
};
