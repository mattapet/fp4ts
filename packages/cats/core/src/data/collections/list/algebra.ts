// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

export abstract class List<out A> {
  readonly __void!: void;

  readonly _A!: () => A;
}

// Definitions

export class Cons<A> extends List<A> {
  public readonly tag = 'cons';
  public constructor(public readonly _head: A, public _tail: List<A>) {
    super();
  }

  public override toString(): string {
    return `${this._head} :: ${this._tail}`;
  }
}

export const Nil = new (class Nil extends List<never> {
  public readonly tag = 'nil';
  public override toString(): string {
    return 'Nil';
  }
})();
export type Nil = typeof Nil;

export type View<A> = Cons<A> | Nil;

export const view = <A>(_: List<A>): View<A> => _ as any;
