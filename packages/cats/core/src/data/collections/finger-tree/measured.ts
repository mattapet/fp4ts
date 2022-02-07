// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Monoid } from '@fp4ts/cats-kernel';

export interface Measured<A, V> {
  readonly monoid: Monoid<V>;

  readonly measure: (a: A) => V;
}
