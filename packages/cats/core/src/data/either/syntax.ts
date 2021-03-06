// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Option } from '../option';
import { Either } from './algebra';
import {
  flatMap_,
  flatTap_,
  flatten,
  isEmpty,
  map_,
  nonEmpty,
  getOrElse_,
  orElse_,
  swapped,
  tap_,
  toOption,
  isRight,
  isLeft,
  get,
  getLeft,
  leftMap_,
  bimap_,
} from './operators';

declare module './algebra' {
  interface Either<out E, out A> {
    readonly isEmpty: boolean;
    readonly nonEmpty: boolean;

    readonly isLeft: boolean;
    readonly isRight: boolean;

    map<B>(f: (a: A) => B): Either<E, B>;
    tap(f: (a: A) => unknown): Either<E, A>;

    leftMap<E2>(f: (e: E) => E2): Either<E2, A>;

    bimap<E2, B>(f: (e: E) => E2, g: (a: A) => B): Either<E2, B>;

    orElse<E2, A2>(
      this: Either<E2, A2>,
      y: () => Either<E2, A2>,
    ): Either<E2, A2>;
    '<|>'<E2, A2>(
      this: Either<E2, A2>,
      y: () => Either<E2, A2>,
    ): Either<E2, A2>;

    getOrElse<A2>(this: Either<E, A2>, defaultValue: () => A2): A2;

    flatMap<E2, B>(
      this: Either<E2, A>,
      f: (a: A) => Either<E2, B>,
    ): Either<E2, B>;
    flatTap<E2>(
      this: Either<E2, A>,
      f: (a: A) => Either<E2, unknown>,
    ): Either<E2, A>;

    readonly flatten: A extends Either<infer E2, infer B>
      ? Either<E | E2, B>
      : never;

    readonly swapped: Either<A, E>;
    readonly toOption: Option<A>;
  }
}

Object.defineProperty(Either.prototype, 'isEmpty', {
  get<E, A>(this: Either<E, A>): boolean {
    return isEmpty(this);
  },
});

Object.defineProperty(Either.prototype, 'nonEmpty', {
  get<E, A>(this: Either<E, A>): boolean {
    return nonEmpty(this);
  },
});

Object.defineProperty(Either.prototype, 'get', {
  get<E, A>(this: Either<E, A>): A {
    return get(this);
  },
});

Object.defineProperty(Either.prototype, 'getLeft', {
  get<E, A>(this: Either<E, A>): E {
    return getLeft(this);
  },
});

Object.defineProperty(Either.prototype, 'isLeft', {
  get<E, A>(this: Either<E, A>): boolean {
    return isLeft(this);
  },
});

Object.defineProperty(Either.prototype, 'isRight', {
  get<E, A>(this: Either<E, A>): boolean {
    return isRight(this);
  },
});

Either.prototype.map = function (f) {
  return map_(this, f);
};

Either.prototype.tap = function (f) {
  return tap_(this, f);
};

Either.prototype.leftMap = function (f) {
  return leftMap_(this, f);
};

Either.prototype.bimap = function (f, g) {
  return bimap_(this, f, g);
};

Either.prototype.orElse = function (that) {
  return orElse_(this, that);
};

Either.prototype['<|>'] = Either.prototype.orElse;

Either.prototype.getOrElse = function <E, A>(
  this: Either<E, A>,
  defaultValue: () => A,
): A {
  return getOrElse_(this, defaultValue);
};

Either.prototype.flatMap = function <E, A, B>(
  this: Either<E, A>,
  f: (a: A) => Either<E, B>,
): Either<E, B> {
  return flatMap_(this, f);
};

Either.prototype.flatTap = function <E, A>(
  this: Either<E, A>,
  f: (a: A) => Either<E, unknown>,
): Either<E, A> {
  return flatTap_(this, f);
};

Object.defineProperty(Either.prototype, 'flatten', {
  get<E, A>(this: Either<E, Either<E, A>>): Either<E, A> {
    return flatten(this);
  },
});

Object.defineProperty(Either.prototype, 'swapped', {
  get<E, A>(this: Either<E, A>): Either<A, E> {
    return swapped(this);
  },
});

Object.defineProperty(Either.prototype, 'toOption', {
  get<A>(this: Either<unknown, A>): Option<A> {
    return toOption(this);
  },
});
