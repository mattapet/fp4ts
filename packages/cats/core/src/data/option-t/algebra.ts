// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';

import { Option } from '../option';

export class OptionT<in out F, out A> {
  private readonly __void!: void;

  public constructor(public readonly value: Kind<F, [Option<A>]>) {}
}
