// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.
export interface HKT<F, Vars extends unknown[]> {
  readonly F: F;
  readonly Vars: Vars;
}
