// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Map } from '@fp4ts/cats';

export type Attributes = Map<string, string>;
export const Attributes = Object.freeze({
  empty: Map.empty,
});
