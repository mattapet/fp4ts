// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, TyK, TyVar } from '@fp4ts/core';
import { Either, EitherT, Eval, Try } from '@fp4ts/cats';
import { MessageFailure, ParsingFailure } from '@fp4ts/http-core';
import { Encoder, Schema, DecodeFailure, Decoder } from '@fp4ts/schema';

export interface Codable<A> {
  encode: (a: A) => string;
  decode: (a: string) => Either<MessageFailure, A>;
}

export const Codable = Object.freeze({
  json: {
    fromSchema<A>(sa: Schema<A>): Codable<A> {
      const decoder = Decoder.string
        .andThen(
          Decoder(s =>
            EitherT(
              Eval.delay(() =>
                Try(() => JSON.parse(s)).toEither.leftMap(
                  e => new DecodeFailure(e.message),
                ),
              ),
            ),
          ),
        )
        .andThen(sa.interpret(Decoder.Schemable));
      const encoder = sa
        .interpret(Encoder.Schemable)
        .map(a => JSON.stringify(a));

      return {
        encode: a => encoder.encode(a),
        decode: s =>
          decoder
            .decode(s)
            .value.value.leftMap(f => new ParsingFailure(f.message)),
      };
    },
  },
});

export interface CodableF extends TyK<[unknown]> {
  [$type]: Codable<TyVar<this, 0>>;
}
