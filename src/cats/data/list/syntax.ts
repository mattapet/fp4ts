import { Kind } from '../../../fp/hkt';
import { Applicative } from '../../applicative';
import { Monoid } from '../../monoid';
import { MonoidK } from '../../monoid-k';

import { List } from './algebra';
import {
  all_,
  any_,
  collectWhile_,
  collect_,
  concat_,
  count_,
  drop_,
  elem_,
  filter_,
  flatMap_,
  flatSequence,
  flatten,
  flatTraverse_,
  foldLeft1_,
  foldLeft_,
  foldMapK_,
  foldMap_,
  foldRight1_,
  foldRight_,
  fold_,
  head,
  isEmpty,
  map_,
  nonEmpty,
  prepend_,
  reverse,
  scanLeft1_,
  scanLeft_,
  scanRight1_,
  scanRight_,
  sequence,
  size,
  slice_,
  tail,
  take_,
  toArray,
  traverse_,
  uncons,
} from './operators';

declare module './algebra' {
  interface List<A> {
    head: A;
    tail: List<A>;
    uncons: [A, List<A>] | undefined;
    isEmpty: boolean;
    nonEmpty: boolean;
    size: number;
    toArray: A[];
    reverse: List<A>;
    prepend: <B = A>(x: B) => List<B>;
    concat: <B = A>(xs: List<B>) => List<B>;
    '+++': <B = A>(xs: List<B>) => List<B>;
    elem: (idx: number) => A;
    all: (p: (a: A) => boolean) => boolean;
    any: (p: (a: A) => boolean) => boolean;
    count: (p: (a: A) => boolean) => number;
    take: (n: number) => List<A>;
    drop: (n: number) => List<A>;
    slice: (from: number, until: number) => List<A>;
    filter: (p: (a: A) => boolean) => List<A>;
    map: <B>(f: (a: A) => B) => List<A>;
    flatMap: <B>(f: (a: A) => List<B>) => List<A>;
    flatten: A extends List<infer B> ? List<B> : never | unknown;
    fold: <B>(onNil: () => B, onCons: (head: A, tail: List<A>) => B) => B;
    foldLeft: <B>(z: B, f: (b: B, a: A) => B) => B;
    foldLeft1: <B = A>(f: (x: B, a: B) => B) => B;
    foldRight: <B>(z: B, f: (a: A, b: B) => B) => B;
    foldRight1: <B = A>(f: (x: B, a: B) => B) => B;
    foldMap: <M>(M: Monoid<M>) => (f: (a: A) => M) => M;
    foldMapK: <F>(F: MonoidK<F>) => <B>(f: (a: A) => Kind<F, B>) => Kind<F, B>;
    collect: <B>(f: (a: A) => B | undefined) => List<B>;
    collectWhile: <B>(f: (a: A) => B | undefined) => List<B>;
    scanLeft: <B>(z: B, f: (b: B, a: A) => B) => List<B>;
    scanLeft1: <B = A>(f: (x: B, y: B) => B) => List<B>;
    scanRight: <B>(z: B, f: (a: A, b: B) => B) => List<B>;
    scanRight1: <B = A>(f: (x: B, y: B) => B) => List<B>;
    traverse: <G>(
      G: Applicative<G>,
    ) => <B>(f: (a: A) => Kind<G, B>) => Kind<G, List<B>>;
    sequence: A extends Kind<unknown, infer B>
      ? <G>(G: Applicative<G>) => Kind<G, List<B>>
      : never | unknown;
    flatTraverse: <G>(
      G: Applicative<G>,
    ) => <B>(f: (a: A) => Kind<G, List<B>>) => Kind<G, List<B>>;
    flatSequence: A extends Kind<unknown, List<infer B>>
      ? <G>(G: Applicative<G>) => Kind<G, List<B>>
      : never | unknown;
  }
}

Object.defineProperty(List.prototype, 'head', {
  get<A>(this: List<A>): A {
    return head(this);
  },
});

Object.defineProperty(List.prototype, 'tail', {
  get<A>(this: List<A>): List<A> {
    return tail(this);
  },
});

Object.defineProperty(List.prototype, 'uncons', {
  get<A>(this: List<A>): [A, List<A>] | undefined {
    return uncons(this);
  },
});

Object.defineProperty(List.prototype, 'isEmpty', {
  get<A>(this: List<A>): boolean {
    return isEmpty(this);
  },
});

Object.defineProperty(List.prototype, 'nonEmpty', {
  get<A>(this: List<A>): boolean {
    return nonEmpty(this);
  },
});

Object.defineProperty(List.prototype, 'size', {
  get<A>(this: List<A>): unknown {
    return size(this);
  },
});

Object.defineProperty(List.prototype, 'toArray', {
  get<A>(this: List<A>): A[] {
    return toArray(this);
  },
});

Object.defineProperty(List.prototype, 'reverse', {
  get<A>(this: List<A>): List<A> {
    return reverse(this);
  },
});

List.prototype.prepend = function <A>(this: List<A>, x: A): List<A> {
  return prepend_(this, x);
};

List.prototype.concat = function <A>(this: List<A>, that: List<A>): List<A> {
  return concat_<A>(this, that);
};

List.prototype['+++'] = function <A>(this: List<A>, that: List<A>): List<A> {
  return this.concat(that);
};

List.prototype.elem = function <A>(this: List<A>, idx: number): A {
  return elem_(this, idx);
};

List.prototype.all = function <A>(
  this: List<A>,
  p: (a: A) => boolean,
): boolean {
  return all_(this, p);
};

List.prototype.any = function <A>(
  this: List<A>,
  p: (a: A) => boolean,
): boolean {
  return any_(this, p);
};

List.prototype.count = function <A>(
  this: List<A>,
  p: (a: A) => boolean,
): number {
  return count_(this, p);
};

List.prototype.take = function <A>(this: List<A>, n: number): List<A> {
  return take_(this, n);
};

List.prototype.drop = function <A>(this: List<A>, n: number): List<A> {
  return drop_(this, n);
};

List.prototype.slice = function <A>(
  this: List<A>,
  from: number,
  until: number,
): List<A> {
  return slice_(this, from, until);
};

List.prototype.filter = function <A>(
  this: List<A>,
  p: (a: A) => boolean,
): List<A> {
  return filter_(this, p);
};

List.prototype.map = function <A, B>(this: List<A>, f: (a: A) => B): List<B> {
  return map_(this, f);
};

List.prototype.flatMap = function <A, B>(
  this: List<A>,
  f: (a: A) => List<B>,
): List<B> {
  return flatMap_(this, f);
};

Object.defineProperty(List.prototype, 'flatten', {
  get<A>(this: List<List<A>>): List<A> {
    return flatten(this);
  },
});

List.prototype.fold = function <A, B>(
  this: List<A>,
  onNil: () => B,
  onCons: (h: A, t: List<A>) => B,
): B {
  return fold_(this, onNil, onCons);
};

List.prototype.foldLeft = function <A, B>(
  this: List<A>,
  z: B,
  f: (b: B, a: A) => B,
): B {
  return foldLeft_(this, z, f);
};

List.prototype.foldLeft1 = function <A>(
  this: List<A>,
  f: (x: A, y: A) => A,
): A {
  return foldLeft1_(this, f);
};

List.prototype.foldRight = function <A, B>(
  this: List<A>,
  z: B,
  f: (a: A, b: B) => B,
): B {
  return foldRight_(this, z, f);
};

List.prototype.foldRight1 = function <A>(
  this: List<A>,
  f: (x: A, y: A) => A,
): A {
  return foldRight1_(this, f);
};

List.prototype.foldMap = function <A, M>(
  this: List<A>,
  M: Monoid<M>,
): (f: (a: A) => M) => M {
  return f => foldMap_(M, this, f);
};

List.prototype.foldMapK = function <A, F>(
  this: List<A>,
  F: MonoidK<F>,
): <B>(f: (a: A) => Kind<F, B>) => Kind<F, B> {
  return f => foldMapK_(F, this, f);
};

List.prototype.collect = function <A, B>(
  this: List<A>,
  f: (a: A) => B | undefined,
): List<B> {
  return collect_(this, f);
};

List.prototype.collectWhile = function <A, B>(
  this: List<A>,
  f: (a: A) => B | undefined,
): List<B> {
  return collectWhile_(this, f);
};

List.prototype.scanLeft = function <A, B>(
  this: List<A>,
  z: B,
  f: (b: B, a: A) => B,
): List<B> {
  return scanLeft_(this, z, f);
};

List.prototype.scanLeft1 = function <A>(
  this: List<A>,
  f: (x: A, y: A) => A,
): List<A> {
  return scanLeft1_(this, f);
};

List.prototype.scanRight = function <A, B>(
  this: List<A>,
  z: B,
  f: (a: A, b: B) => B,
): List<B> {
  return scanRight_(this, z, f);
};

List.prototype.scanRight1 = function <A>(
  this: List<A>,
  f: (x: A, y: A) => A,
): List<A> {
  return scanRight1_(this, f);
};

List.prototype.traverse = function <A, G>(
  this: List<A>,
  G: Applicative<G>,
): <B>(f: (a: A) => Kind<G, B>) => Kind<G, List<B>> {
  return f => traverse_(G, this, f);
};

List.prototype.sequence = function <A, G>(
  this: List<Kind<G, A>>,
  G: Applicative<G>,
): Kind<G, List<A>> {
  return sequence(G)(this);
};

List.prototype.flatTraverse = function <A, G>(
  G: Applicative<G>,
): <B>(f: (a: A) => Kind<G, List<B>>) => Kind<G, List<B>> {
  return f => flatTraverse_(G, this, f);
};

List.prototype.flatSequence = function <A, G>(
  this: List<Kind<G, List<A>>>,
  G: Applicative<G>,
): Kind<G, List<A>> {
  return flatSequence(G)(this);
};