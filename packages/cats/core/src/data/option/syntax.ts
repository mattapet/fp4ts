// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, PrimitiveType } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats-kernel';
import { Applicative } from '../../applicative';
import { List } from '../collections/list';
import { Either } from '../either';
import { Option } from './algebra';
import {
  flatMap_,
  flatTap_,
  flatten,
  isEmpty,
  map_,
  nonEmpty,
  tap_,
  orElse_,
  getOrElse_,
  equals_,
  toList,
  toLeft_,
  toRight_,
  traverse_,
  filter_,
} from './operators';

declare module './algebra' {
  interface Option<out A> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    readonly toList: List<A>;

    toLeft<B>(right: () => B): Either<A, B>;
    toRight<B>(left: () => B): Either<B, A>;

    filter<B extends A>(f: (a: A) => a is B): Option<B>;
    filter(f: (a: A) => boolean): Option<A>;

    map<B>(f: (a: A) => B): Option<B>;
    tap(f: (a: A) => unknown): Option<A>;

    orElse<A2>(this: Option<A2>, that: () => Option<A2>): Option<A2>;
    '<|>'<A2>(this: Option<A2>, that: () => Option<A2>): Option<A2>;

    getOrElse<A2>(this: Option<A2>, defaultValue: () => A2): A2;

    flatMap<B>(f: (a: A) => Option<B>): Option<B>;
    flatTap(f: (a: A) => Option<unknown>): Option<A>;
    readonly flatten: A extends Option<infer B> ? Option<B> : never;

    traverse<F>(
      F: Applicative<F>,
    ): <B>(f: (a: A) => Kind<F, [B]>) => Kind<F, [Option<B>]>;

    equals<B extends PrimitiveType>(this: Option<B>, that: Option<B>): boolean;
    equals<B>(this: Option<B>, E: Eq<B>, that: Option<B>): boolean;
  }
}

Object.defineProperty(Option.prototype, 'isEmpty', {
  get<A>(this: Option<A>): boolean {
    return isEmpty(this);
  },
});

Object.defineProperty(Option.prototype, 'nonEmpty', {
  get<A>(this: Option<A>): boolean {
    return nonEmpty(this);
  },
});

Object.defineProperty(Option.prototype, 'toList', {
  get<A>(this: Option<A>): List<A> {
    return toList(this);
  },
});

Option.prototype.toLeft = function (f) {
  return toLeft_(this, f);
};
Option.prototype.toRight = function (f) {
  return toRight_(this, f);
};

Option.prototype.filter = function (f: any) {
  return filter_(this, f);
};

Option.prototype.map = function <A, B>(
  this: Option<A>,
  f: (a: A) => B,
): Option<B> {
  return map_(this, f);
};

Option.prototype.tap = function <A>(
  this: Option<A>,
  f: (a: A) => unknown,
): Option<A> {
  return tap_(this, f);
};

Option.prototype.orElse = function (that) {
  return orElse_(this, that);
};

Option.prototype['<|>'] = Option.prototype.orElse;

Option.prototype.getOrElse = function <A>(
  this: Option<A>,
  defaultValue: () => A,
): A {
  return getOrElse_(this, defaultValue);
};

Option.prototype.flatMap = function <A, B>(
  this: Option<A>,
  f: (a: A) => Option<B>,
): Option<B> {
  return flatMap_(this, f);
};

Option.prototype.flatTap = function <A>(
  this: Option<A>,
  f: (a: A) => Option<unknown>,
): Option<A> {
  return flatTap_(this, f);
};

Object.defineProperty(Option.prototype, 'flatten', {
  get<A>(this: Option<Option<A>>): Option<A> {
    return flatten(this);
  },
});

Option.prototype.traverse = function (F) {
  return f => traverse_(F)(this, f);
};

Option.prototype.equals = function (...args: any[]): any {
  return args.length === 2
    ? equals_(args[0])(this, args[1])
    : equals_(Eq.primitive)(this, args[0]);
};
