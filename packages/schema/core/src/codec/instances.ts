// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Lazy, lazyVal } from '@fp4ts/core';
import { Invariant } from '@fp4ts/cats';
import { Schemable } from '@fp4ts/schema-kernel';
import { Codec0, Codec } from './algebra';
import { CodecF } from './codec';
import {
  array,
  boolean,
  defer,
  literal,
  nullType,
  number,
  product,
  record,
  string,
  struct,
  sum,
} from './constructors';
import { imap_, nullable, optional } from './operators';

export const codecInvariant: <I, O>() => Invariant<$<CodecF, [I, O]>> = lazyVal(
  () => Invariant.of({ imap_: imap_ }),
);

export const codecSchemable: Lazy<Schemable<$<CodecF, [unknown, unknown]>>> =
  lazyVal(() =>
    Schemable.of({
      literal: literal as Schemable<$<CodecF, [unknown, unknown]>>['literal'],
      boolean: boolean,
      number: number,
      string: string,
      null: nullType,

      nullable: nullable,
      array: array,
      optional: optional,

      record: record,
      product: product as Schemable<$<CodecF, [unknown, unknown]>>['product'],
      struct: struct,
      sum: sum as Schemable<$<CodecF, [unknown, unknown]>>['sum'],
      defer: defer,
      imap: <A, B>(
        fa: Codec<unknown, A, A>,
        f: (a: A) => B,
        g: (b: B) => A,
      ) => {
        const fa0 = fa as Codec0<unknown, A, A>;
        return new Codec0(fa0.encoder.contramap(g), fa0.decoder.map(f));
      },
    }),
  );
