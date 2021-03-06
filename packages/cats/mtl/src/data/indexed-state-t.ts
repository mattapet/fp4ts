// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Fix, Kind, α, β, λ } from '@fp4ts/core';
import { Applicative, Functor, Monad, MonadError } from '@fp4ts/cats-core';

import {
  IndexedReaderWriterStateT,
  IndexedReaderWriterStateTF,
} from './indexed-reader-writer-state-t';
import { MonadState } from '../monad-state';

export type IndexedStateT<F, SA, SB, A> = IndexedReaderWriterStateT<
  F,
  unknown,
  SA,
  SB,
  unknown,
  A
>;

export const IndexedStateT: IndexedStateTObj = function (F) {
  return IndexedReaderWriterStateT.state(F);
};

interface IndexedStateTObj {
  <F>(F: Applicative<F>): <SA, SB, A>(
    f: (sa: SA) => Kind<F, [[SB, A]]>,
  ) => IndexedStateT<F, SA, SB, A>;
  // -- Instances

  Functor<F, S>(F: Functor<F>): Functor<IndexedStateTF<F, S, S>>;
  Monad<F, S>(F: Monad<F>): Monad<IndexedStateTF<F, S, S>>;
  MonadError<F, S, E>(
    F: MonadError<F, E>,
  ): MonadError<IndexedStateTF<F, S, S>, E>;
  MonadState<F, S>(F: Monad<F>): MonadState<IndexedStateTF<F, S, S>, S>;
}

IndexedStateT.Functor = IndexedReaderWriterStateT.Functor;
IndexedStateT.Monad = IndexedReaderWriterStateT.Monad;
IndexedStateT.MonadError = IndexedReaderWriterStateT.MonadError;
IndexedStateT.MonadState = IndexedReaderWriterStateT.MonadState;

// -- HKT

/**
 * @category Type Constructor
 * @category Data
 */
export type IndexedStateTF<F, SA, SB> = $<
  IndexedReaderWriterStateTF,
  [F, unknown, SA, SB, unknown]
>;

/**
 * @category Type Constructor
 * @category Data
 */
export type IndexedStateTFA<F, A> = λ<
  IndexedReaderWriterStateTF,
  [Fix<F>, Fix<unknown>, α, β, Fix<unknown>, Fix<A>]
>;
