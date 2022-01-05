// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export class ApiGroup<A extends unknown[]> {
  private readonly __void!: void;
  public constructor(public readonly lists: A) {}
}
