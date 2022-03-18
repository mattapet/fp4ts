// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Foldable, List, Monoid, None, Option, Some } from '@fp4ts/cats';

import { Optional } from './optional';
import * as Monoids from './internal/monoids';
import { Getter } from './getter';
import { At } from './function';

export class Fold<S, A> {
  public static fromFoldable<F>(
    F: Foldable<F>,
  ): <A>() => Fold<Kind<F, [A]>, A> {
    return <A>() => new Fold<Kind<F, [A]>, A>(F.foldMap);
  }

  public static select<A>(p: (a: A) => boolean): Fold<A, A> {
    return new Fold(
      <M>(M: Monoid<M>) =>
        (f: (a: A) => M) =>
        (s: A) =>
          p(s) ? f(s) : M.empty,
    );
  }

  public constructor(
    public readonly foldMap: <M>(
      M: Monoid<M>,
    ) => (f: (a: A) => M) => (s: S) => M,
  ) {}

  public fold(M: Monoid<A>): (s: S) => A {
    return this.foldMap(M)(x => x);
  }

  public getAll(s: S): List<A> {
    return this.foldMap(List.MonoidK.algebra<A>())(List)(s);
  }

  public find(p: (a: A) => boolean): (s: S) => Option<A> {
    return this.foldMap(Monoids.firstOption<A>())(x => (p(x) ? Some(x) : None));
  }

  public headOption(s: S): Option<A> {
    return this.foldMap(Monoids.firstOption<A>())(Some)(s);
  }

  public lastOption(s: S): Option<A> {
    return this.foldMap(Monoids.lastOption<A>())(Some)(s);
  }

  public any(p: (a: A) => boolean): (s: S) => boolean {
    return this.foldMap(Monoid.disjunction)(p);
  }
  public all(p: (a: A) => boolean): (s: S) => boolean {
    return this.foldMap(Monoid.conjunction)(p);
  }
  public count(p: (a: A) => boolean): (s: S) => number {
    return this.foldMap(Monoid.addition)(x => (p(x) ? 1 : 0));
  }

  public size(s: S): number {
    return this.foldMap(Monoid.addition)(() => 1)(s);
  }

  public isEmpty(s: S): boolean {
    return this.foldMap(Monoid.conjunction)(() => false)(s);
  }

  public nonEmpty(s: S): boolean {
    return !this.isEmpty(s);
  }

  public to<C>(this: Fold<S, A>, f: (a: A) => C): Fold<S, C> {
    return this.andThen(new Getter(f));
  }

  // -- Composition

  public andThen<B>(that: Fold<A, B>): Fold<S, B> {
    return new Fold(
      <M>(M: Monoid<M>) =>
        (f: (b: B) => M) =>
          this.foldMap(M)(that.foldMap(M)(f)),
    );
  }

  // -- Additional Syntax

  public filter<B extends A>(f: (a: A) => a is B): Fold<S, B>;
  public filter(f: (a: A) => boolean): Fold<S, A>;
  public filter(f: (a: A) => boolean): Fold<S, A> {
    return this.andThen(Optional.filter(f));
  }

  public at<I, A1>(this: Fold<S, A>, i: I, at: At<A, I, A1>): Fold<S, A1> {
    return this.andThen(at.at(i));
  }
}