// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc from 'fast-check';
import { id, pipe } from '@fp4ts/core';
import { Eval, EvalF } from '@fp4ts/cats-core';
import { Eq } from '@fp4ts/cats-kernel';
import { Backwards, Identity } from '@fp4ts/cats-core/lib/data';
import { MonadSuite } from '@fp4ts/cats-laws';
import { checkAll } from '@fp4ts/cats-test-kit';
import * as A from '@fp4ts/cats-test-kit/lib/arbitraries';

describe('Backwards', () => {
  it('should execute the effects in reversed order', () => {
    const F = Backwards.Applicative(Eval.Applicative);
    let acc = '';

    pipe(
      F.product_(
        Backwards<EvalF, string>(Eval.delay(() => (acc += ' my first action'))),
        Backwards<EvalF, string>(Eval.delay(() => (acc += 'my second action'))),
      ),
      x => Backwards.getBackwards<EvalF, any>(x),
    ).value;

    expect(acc).toBe('my second action my first action');
  });

  checkAll(
    'Backwards<Identity, *>',
    MonadSuite(Backwards.Monad(Identity.Monad)).monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      id as any,
      id as any,
    ),
  );

  checkAll(
    'Backwards<Eval, *>',
    MonadSuite(Backwards.Monad(Eval.Monad)).monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      A.fp4tsEval as any,
      Eval.Eq as any,
    ),
  );
});
