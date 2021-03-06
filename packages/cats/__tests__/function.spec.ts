// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Function1 } from '@fp4ts/cats-core/lib/data';
import { Eq } from '@fp4ts/cats-kernel';
import {
  ArrowApplySuite,
  ArrowChoiceSuite,
  DistributiveSuite,
  MonadSuite,
} from '@fp4ts/cats-laws';
import { checkAll, ExhaustiveCheck, MiniInt } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';
import * as ec from '@fp4ts/cats-test-kit/lib/exhaustive-check';
import * as eq from '@fp4ts/cats-test-kit/lib/eq';

describe('Function1', () => {
  checkAll(
    'Distributive<Function1<number, *>>',
    DistributiveSuite(Function1.Distributive<MiniInt>()).distributive(
      fc.string(),
      fc.string(),
      fc.string(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      <X>(arbX: Arbitrary<X>) => fc.func<[MiniInt], X>(arbX),
      <X>(EqX: Eq<X>) => eq.fn1Eq(ec.miniInt(), EqX),
    ),
  );

  checkAll(
    'Monad<Function1<number, *>>',
    MonadSuite(Function1.Monad<MiniInt>()).monad(
      fc.string(),
      fc.string(),
      fc.string(),
      fc.string(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      <X>(arbX: Arbitrary<X>) => fc.func<[MiniInt], X>(arbX),
      <X>(EqX: Eq<X>) => eq.fn1Eq(ec.miniInt(), EqX),
    ),
  );

  checkAll(
    'ArrowApply<Function1>',
    ArrowApplySuite(Function1.ArrowApply).arrowApply(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      fc.integer(),
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      ec.miniInt(),
      Eq.primitive,
      ec.boolean(),
      Eq.primitive,
      ec.boolean(),
      Eq.primitive,
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      eq.fn1Eq,
      <X, Y>(ecx: ExhaustiveCheck<X>, ecy: ExhaustiveCheck<Y>) =>
        ec.instance(ecy.allValues.map(y => (x: X) => y)),
    ),
  );

  checkAll(
    'ArrowChoice<Function1>',
    ArrowChoiceSuite(Function1.ArrowChoice).arrowChoice(
      A.fp4tsMiniInt(),
      A.fp4tsMiniInt(),
      fc.boolean(),
      fc.boolean(),
      fc.integer(),
      fc.integer(),
      MiniInt.Eq,
      ec.miniInt(),
      MiniInt.Eq,
      ec.miniInt(),
      Eq.primitive,
      ec.boolean(),
      Eq.primitive,
      ec.boolean(),
      Eq.primitive,
      <X, Y>(X: Arbitrary<X>, Y: Arbitrary<Y>) => fc.func<[X], Y>(Y),
      eq.fn1Eq,
    ),
  );
});
