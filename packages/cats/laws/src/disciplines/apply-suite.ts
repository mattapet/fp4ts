import fc, { Arbitrary } from 'fast-check';
import { AnyK, Kind } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats-core';
import { forAll, RuleSet } from '@cats4ts/cats-test-kit';

import { ApplyLaws } from '../apply-laws';
import { FunctorSuite } from './functor-suite';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ApplySuite = <F extends AnyK>(laws: ApplyLaws<F>) => {
  const self = {
    ...FunctorSuite(laws),

    apply: <A, B, C>(
      arbFA: Arbitrary<Kind<F, [A]>>,
      arbFB: Arbitrary<Kind<F, [B]>>,
      arbFC: Arbitrary<Kind<F, [C]>>,
      arbFAtoB: Arbitrary<Kind<F, [(a: A) => B]>>,
      arbFBtoC: Arbitrary<Kind<F, [(b: B) => C]>>,
      arbB: Arbitrary<B>,
      arbC: Arbitrary<C>,
      EqFA: Eq<Kind<F, [A]>>,
      EqFC: Eq<Kind<F, [C]>>,
    ): RuleSet => {
      const {
        applyComposition,
        map2ProductConsistency,
        map2EvalConsistency,
        productLConsistency,
        productRConsistency,
      } = laws;

      return new RuleSet(
        'apply',
        [
          [
            'apply composition',
            forAll(arbFA, arbFAtoB, arbFBtoC, applyComposition)(EqFC),
          ],
          [
            'map2/product-map consistency',
            forAll(
              arbFA,
              arbFB,
              fc.func<[A, B], C>(arbC),
              map2ProductConsistency,
            )(EqFC),
          ],
          [
            'map2/map2Eval consistency',
            forAll(
              arbFA,
              arbFB,
              fc.func<[A, B], C>(arbC),
              map2EvalConsistency,
            )(EqFC),
          ],
          [
            'productL consistent map2',
            forAll(arbFA, arbFC, productLConsistency)(EqFA),
          ],
          [
            'productR consistent map2',
            forAll(arbFA, arbFC, productRConsistency)(EqFC),
          ],
        ],
        { parent: self.functor(arbFA, arbB, arbC, EqFA, EqFC) },
      );
    },
  };
  return self;
};
