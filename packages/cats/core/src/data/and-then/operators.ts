// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { flow } from '@fp4ts/core';
import { AndThen, Concat, Single, view } from './algebra';
import { fusionMaxStackDepth } from './consts';

export const andThen: <E, B>(
  g: (e: E) => B,
) => <A>(f: AndThen<A, E>) => AndThen<A, B> = g => f => andThen_(f, g);

export const compose: <A, E>(
  f: (e: A) => E,
) => <B>(f: AndThen<E, B>) => AndThen<A, B> = f => g => compose_(g, f);

// -- Point-ful operators

export const andThen_ = <A, E, B>(
  f: AndThen<A, E>,
  g: (e: E) => B,
): AndThen<A, B> => {
  if (g instanceof AndThen) return _andThen(f, g);
  const fv = view(f);
  switch (fv.tag) {
    case 'single':
      if (fv.idx < fusionMaxStackDepth)
        return new Single(flow(f, g), fv.idx + 1);
      return new Concat(f, new Single(g, 0));

    case 'concat': {
      const rv = view(fv.right);
      if (rv.tag === 'single' && rv.idx < fusionMaxStackDepth)
        return new Concat(fv.left, new Single(flow(rv.fun, g), rv.idx + 1));
      return new Concat(f, new Single(g, 0));
    }
  }
};

export const compose_ = <A, E, B>(
  g: AndThen<E, B>,
  f: (e: A) => E,
): AndThen<A, B> => {
  if (f instanceof AndThen) return _andThen(f, g);
  const gv = view(g);
  switch (gv.tag) {
    case 'single':
      if (gv.idx < fusionMaxStackDepth)
        return new Single(flow(f, g), gv.idx + 1);
      return new Concat(new Single(f, 0), g);

    case 'concat': {
      const lv = view(gv.left);
      if (lv.tag === 'single' && lv.idx < fusionMaxStackDepth)
        return new Concat(new Single(flow(f, lv.fun), lv.idx + 1), gv.right);
      return new Concat(new Single(f, 0), g);
    }
  }
};

// -- Private implementation
const _andThen = <A, B, C>(
  ab: AndThen<A, B>,
  bc: AndThen<B, C>,
): AndThen<A, C> => {
  const fv = view(ab);
  const gv = view(bc);
  if (fv.tag === 'single') {
    const [f, indexF] = [fv.fun, fv.idx];
    if (gv.tag === 'single') {
      const [g, indexG] = [gv.fun, gv.idx];

      return indexF + indexG < fusionMaxStackDepth
        ? new Single(flow(f, g), indexF + indexG)
        : new Concat(ab, bc);
    } else {
      const leftV = view(gv.left);
      if (leftV.tag === 'single' && indexF + leftV.idx < fusionMaxStackDepth) {
        return new Concat(
          new Single(flow(f, leftV.fun), indexF + leftV.idx),
          gv.right,
        );
      } else {
        return new Concat(ab, bc);
      }
    }
  }

  const frv = view(fv.right);
  if (frv.tag === 'single') {
    const [f, indexF] = [frv.fun, frv.idx];
    const gv = view(bc);
    if (gv.tag === 'single') {
      const [g, indexG] = [gv.fun, gv.idx];
      return indexF + indexG < fusionMaxStackDepth
        ? new Concat(fv.left, new Single(flow(f, g), indexF + indexG))
        : new Concat(ab, bc);
    } else {
      const leftV = view(gv.left);
      if (leftV.tag === 'single' && indexF + leftV.idx < fusionMaxStackDepth) {
        return new Concat(
          fv.left,
          new Concat(
            new Single(flow(f, leftV.fun), indexF + leftV.idx),
            gv.right,
          ),
        );
      } else {
        return new Concat(ab, bc);
      }
    }
  } else {
    return new Concat(ab, bc);
  }
};
