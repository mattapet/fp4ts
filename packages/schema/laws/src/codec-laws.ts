// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Either, Right } from '@fp4ts/cats';
import { IsEq } from '@fp4ts/cats-test-kit';
import { Codec, DecodeFailure } from '@fp4ts/schema-core';

export const CodecLaws = <A>(C: Codec<unknown, any, A>) => ({
  codecDecodeToEncodeIdentity: <T>(t: T): IsEq<T> =>
    new IsEq(
      C.decode(t).value.value.fold(
        () => t,
        a => C.encode(a),
      ),
      t,
    ),

  codecEncodeToDecodeIdentity: (a: A): IsEq<Either<DecodeFailure, A>> =>
    new IsEq(C.decode(C.encode(a)).value.value, Right(a)),
});