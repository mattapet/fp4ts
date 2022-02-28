// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Char, Lazy, lazyVal, newtype, TypeOf } from '@fp4ts/core';
import { parser, Parser, StringSource, text, Rfc5234 } from '@fp4ts/parse';
import { ParseResult, Rfc7230 } from './parsing';

const QValueCotr = newtype<number>()('@fp4ts/http/core/q-value');
export type QValue = TypeOf<typeof QValueCotr>;

export const QValue = Object.freeze({
  one: QValueCotr(1_000),
  zero: QValueCotr(0),

  toThousands: QValueCotr.unapply,

  toString: (q: QValue): string => `q=${0.001 * QValueCotr.unapply(q)}`,

  fromThousands: (x: number): ParseResult<QValue> =>
    mkQValue(x, `${0.001 * x}`),
  fromNumber: (x: number): ParseResult<QValue> =>
    mkQValue((x * 1_000) | 0, `${x}`),
  fromString: (s: string): ParseResult<QValue> => {
    const x = parseFloat(s);
    return Number.isNaN(x)
      ? ParseResult.fail('Invalid q-value', `${s} is not a number`)
      : ParseResult.success(QValueCotr(x));
  },

  get parser(): Parser<StringSource, QValue> {
    return parser_();
  },
});

const mkQValue = (thousands: number, s: string): ParseResult<QValue> =>
  thousands < 0 || thousands > 1_000
    ? ParseResult.fail('Invalid q-value', `${s} must be between 0.0 and 1.0`)
    : ParseResult.success(QValueCotr(thousands));

const parser_: Lazy<Parser<StringSource, QValue>> = lazyVal(() => {
  const eof = Parser.eof<StringSource>();
  const ch = text.char;
  const decQValue = Rfc5234.digit()
    .rep1()
    .collect(xs => QValue.fromString(xs.toArray.join('')).toOption);

  const qvalue = ch('0' as Char)
    ['*>'](eof.as(QValue.zero).orElse(() => decQValue))
    .orElse(() =>
      ch('1' as Char)
        ['*>'](
          ch('.' as Char)
            ['*>'](ch('0' as Char).rep())
            .optional(),
        )
        .as(QValue.one),
    );

  return parser`;${Rfc7230.ows}${text.oneOf('qQ')}=${qvalue}`
    .backtrack()
    .map(([, , q]) => q)
    .orElse(() => Parser.succeed(QValue.one));
});