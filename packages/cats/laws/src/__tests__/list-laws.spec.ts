import fc from 'fast-check';
import { AdditionMonoid, Eq, Eval, EvalK } from '@cats4ts/cats-core';
import { List } from '@cats4ts/cats-core/lib/data';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

import { AlternativeSuite } from '../disciplines/alternative-suite';
import { MonadSuite } from '../disciplines/monad-suite';
import { FunctorFilterSuite } from '../disciplines/functor-filter-suite';
import { UnorderedTraversableSuite } from '../disciplines/unordered-traversable-suite';
import { FoldableSuite } from '../disciplines/foldable-suite';

describe('List laws', () => {
  const eqListNumber: Eq<List<number>> = Eq.of({
    equals: (xs, ys) => xs.equals(Eq.primitive, ys),
  });

  const functorFilterTests = FunctorFilterSuite(List.FunctorFilter);
  checkAll(
    'FunctorFilter<List>',
    functorFilterTests.functorFilter(
      A.cats4tsList(fc.integer()),
      A.cats4tsList(A.cats4tsOption(fc.integer())),
      fc.integer(),
      fc.integer(),
      eqListNumber,
      eqListNumber,
      eqListNumber,
    ),
  );

  const alternativeTests = AlternativeSuite(List.Alternative);
  checkAll(
    'Alternative<List>',
    alternativeTests.alternative(
      A.cats4tsList(fc.integer()),
      A.cats4tsList(fc.integer()),
      A.cats4tsList(fc.integer()),
      A.cats4tsList(fc.func<[number], number>(fc.integer())),
      A.cats4tsList(fc.func<[number], number>(fc.integer())),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      eqListNumber,
      eqListNumber,
      eqListNumber,
    ),
  );

  const monadTests = MonadSuite(List.Monad);
  checkAll(
    'Monad<List>',
    monadTests.monad(
      A.cats4tsList(fc.integer()),
      A.cats4tsList(fc.integer()),
      A.cats4tsList(fc.integer()),
      A.cats4tsList(fc.integer()),
      A.cats4tsList(fc.func<[number], number>(fc.integer())),
      A.cats4tsList(fc.func<[number], number>(fc.integer())),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      eqListNumber,
      eqListNumber,
      eqListNumber,
      eqListNumber,
    ),
  );

  const unorderedTraversableTests = UnorderedTraversableSuite(List.Traversable);
  checkAll(
    'UnorderedTraversable<List>',
    unorderedTraversableTests.unorderedTraversable<
      number,
      number,
      number,
      EvalK,
      EvalK
    >(
      A.cats4tsList(fc.integer()),
      A.cats4tsEval(fc.integer()),
      A.cats4tsEval(fc.integer()),
      A.cats4tsEval(fc.integer()),
      fc.integer(),
      AdditionMonoid,
      List.Functor,
      Eval.Applicative,
      Eval.Applicative,
      Eq.primitive,
      eqListNumber,
      Eval.Eq(Eval.Eq(eqListNumber)),
      Eval.Eq(eqListNumber),
      Eval.Eq(eqListNumber),
    ),
  );

  const foldableTests = FoldableSuite(List.Foldable);
  checkAll(
    'Foldable<List>',
    foldableTests.foldable(
      A.cats4tsList(fc.integer()),
      fc.integer(),
      AdditionMonoid,
      AdditionMonoid,
      Eq.primitive,
      Eq.primitive,
    ),
  );
});
