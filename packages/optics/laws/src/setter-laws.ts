// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { compose } from '@fp4ts/core';
import { Setter, replace, modify } from '@fp4ts/optics-core';
import { IsEq } from '@fp4ts/cats-test-kit';

export const SetterLaws = <S, A>(setter: Setter<S, A>) => ({
  replaceIdempotent: (s: S, a: A): IsEq<S> =>
    new IsEq(replace(setter)(a)(replace(setter)(a)(s)), replace(setter)(a)(s)),

  modifyIdentity: (s: S): IsEq<S> => new IsEq(modify(setter)(a => a)(s), s),

  composeModify: (s: S, f: (a: A) => A, g: (a: A) => A): IsEq<S> =>
    new IsEq(
      modify(setter)(g)(modify(setter)(f)(s)),
      modify(setter)(compose(g, f))(s),
    ),

  consistentReplaceModify: (s: S, a: A): IsEq<S> =>
    new IsEq(modify(setter)(() => a)(s), replace(setter)(a)(s)),
});
