// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { FunctionK, OptionF } from '@fp4ts/cats';
import { SchemaK } from './algebra';
import { array, compose_, imap_, optional } from './operators';

declare module './algebra' {
  interface SchemaK<F> {
    readonly array: SchemaK<[OptionF, F]>;
    readonly optional: SchemaK<[OptionF, F]>;

    compose<G>(that: SchemaK<G>): SchemaK<[F, G]>;
    imap<G>(f: FunctionK<F, G>, g: FunctionK<G, F>): SchemaK<G>;
  }
}

Object.defineProperty(SchemaK.prototype, 'array', {
  get<F>(this: SchemaK<F>) {
    return array(this);
  },
});
Object.defineProperty(SchemaK.prototype, 'optional', {
  get<F>(this: SchemaK<F>) {
    return optional(this);
  },
});

SchemaK.prototype.compose = function (that) {
  return compose_(this, that);
};
SchemaK.prototype.imap = function (f, g) {
  return imap_(this, f, g);
};