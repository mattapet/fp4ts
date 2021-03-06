// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind, instance, tupled, TyK, $type, TyVar } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { Monad } from './monad';
import { Eval } from './eval';
import { UnorderedFoldable } from './unordered-foldable';
import {
  List,
  ListBuffer,
  Vector,
  VectorBuilder,
  Option,
  Some,
  None,
  Either,
  Left,
  Right,
  Iter,
  Endo,
  Dual,
} from './data';
import { ComposedFoldable } from './composed';

/**
 * @category Type Class
 */
export interface Foldable<F> extends UnorderedFoldable<F> {
  readonly foldLeft: <A, B>(
    b: B,
    f: (b: B, a: A) => B,
  ) => (fa: Kind<F, [A]>) => B;
  readonly foldLeft_: <A, B>(fa: Kind<F, [A]>, b: B, f: (b: B, a: A) => B) => B;

  readonly foldRight: <A, B>(
    b: Eval<B>,
    f: (a: A, b: Eval<B>) => Eval<B>,
  ) => (fa: Kind<F, [A]>) => Eval<B>;
  readonly foldRight_: <A, B>(
    fa: Kind<F, [A]>,
    b: Eval<B>,
    f: (a: A, b: Eval<B>) => Eval<B>,
  ) => Eval<B>;

  readonly foldMap: <M>(
    M: Monoid<M>,
  ) => <A>(f: (a: A) => M) => (fa: Kind<F, [A]>) => M;
  readonly foldMap_: <M>(
    M: Monoid<M>,
  ) => <A>(fa: Kind<F, [A]>, f: (a: A) => M) => M;

  readonly foldM: <G>(
    G: Monad<G>,
  ) => <A, B>(
    z: B,
    f: (b: B, a: A) => Kind<G, [B]>,
  ) => (fa: Kind<F, [A]>) => Kind<G, [B]>;
  readonly foldM_: <G>(
    G: Monad<G>,
  ) => <A, B>(
    fa: Kind<F, [A]>,
    z: B,
    f: (b: B, a: A) => Kind<G, [B]>,
  ) => Kind<G, [B]>;

  readonly elem: (idx: number) => <A>(fa: Kind<F, [A]>) => Option<A>;
  readonly elem_: <A>(fa: Kind<F, [A]>, idx: number) => Option<A>;

  readonly iterator: <A>(fa: Kind<F, [A]>) => Iterator<A>;
  readonly toList: <A>(fa: Kind<F, [A]>) => List<A>;
  readonly toVector: <A>(fa: Kind<F, [A]>) => Vector<A>;
}

export type FoldableRequirements<F> = Pick<Foldable<F>, 'foldMap_'> &
  Partial<Foldable<F>> &
  Partial<UnorderedFoldable<F>>;
export const Foldable = Object.freeze({
  of: <F>(F: FoldableRequirements<F>): Foldable<F> => {
    const self: Foldable<F> = instance<Foldable<F>>({
      foldMap: M => f => fa => self.foldMap_(M)(fa, f),

      foldLeft: (z, f) => fa => self.foldLeft_(fa, z, f),
      foldLeft_: <A, B>(fa: Kind<F, [A]>, z: B, f: (b: B, a: A) => B): B =>
        Dual.getDual(
          self.foldMap_(Dual.Monoid(Endo.MonoidK.algebra<B>()))(fa, (a: A) =>
            Dual((b: B) => f(b, a)),
          ),
        )(z),

      foldRight: (z, f) => fa => self.foldRight_(fa, z, f),
      foldRight_: <A, B>(
        fa: Kind<F, [A]>,
        ez: Eval<B>,
        f: (a: A, eb: Eval<B>) => Eval<B>,
      ): Eval<B> =>
        self.foldMap_(Endo.MonoidK.algebra<Eval<B>>())(
          fa,
          a => eb => Eval.defer(() => f(a, eb)),
        )(ez),

      foldM: G => (z, f) => fa => self.foldM_(G)(fa, z, f),
      foldM_: G => (fa, z, f) => {
        const src = Source.fromFoldable(self)(fa);
        return G.tailRecM(tupled(z, src))(([b, src]) =>
          src.uncons.fold(
            () => G.pure(Right(b)),
            ([a, src]) => G.map_(f(b, a), b => Left(tupled(b, src.value))),
          ),
        );
      },

      elem: idx => fa => self.elem_(fa, idx),
      elem_: <A>(fa: Kind<F, [A]>, idx: number) => {
        if (idx < 0) return None;
        return self
          .foldM_(Either.Monad<A>())(fa, 0, (i, a) =>
            i === idx ? Left(a) : Right(i + 1),
          )
          .fold(
            a => Some(a),
            () => None,
          );
      },

      iterator: <A>(fa: Kind<F, [A]>): Iterator<A> => {
        let src = Eval.now(Source.fromFoldable(self)(fa));
        return Iter.lift(() => {
          const next = src.value.uncons;
          if (next.isEmpty) return Iter.Result.done;

          const [a, src_] = next.get;
          src = src_;
          return Iter.Result.pure(a);
        });
      },

      toList: <A>(fa: Kind<F, [A]>) =>
        self.foldLeft_(fa, new ListBuffer<A>(), (as, a) => as.addOne(a)).toList,

      toVector: <A>(fa: Kind<F, [A]>) =>
        self.foldLeft_(fa, new VectorBuilder<A>(), (as, a) => as.addOne(a))
          .toVector,

      ...UnorderedFoldable.of({
        unorderedFoldMap_: F.unorderedFoldMap_ ?? F.foldMap_,
        ...F,
      }),
      ...F,
    });
    return self;
  },

  compose: <F, G>(F: Foldable<F>, G: Foldable<G>): ComposedFoldable<F, G> =>
    ComposedFoldable.of(F, G),
});

interface Source<A> {
  readonly uncons: Option<[A, Eval<Source<A>>]>;
}
const Source = Object.freeze({
  get empty(): Source<never> {
    return { uncons: None };
  },

  cons: <A>(a: A, src: Eval<Source<A>>): Source<A> => ({
    uncons: Some([a, src]),
  }),

  fromFoldable:
    <F>(F: Foldable<F>) =>
    <A>(fa: Kind<F, [A]>): Source<A> =>
      F.foldRight_(fa, Eval.now<Source<A>>(Source.empty), (a, evalSrc) =>
        Eval.delay(() => Source.cons(a, evalSrc)),
      ).value,
});

// -- HKT

export interface FoldableF extends TyK<[unknown]> {
  [$type]: Foldable<TyVar<this, 0>>;
}
