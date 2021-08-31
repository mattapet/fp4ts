import { flow, id } from '../../../fp/core';
import { Option, view } from './algebra';
import { none, some } from './constructors';

export const map: <A, B>(f: (a: A) => B) => (o: Option<A>) => Option<B> =
  f => o =>
    map_(o, f);

export const tap: <A>(f: (a: A) => unknown) => (o: Option<A>) => Option<A> =
  f => o =>
    tap_(o, f);

export const flatMap: <A, B>(
  f: (a: A) => Option<B>,
) => (o: Option<A>) => Option<B> = f => o => flatMap_(o, f);

export const flatTap: <A>(
  f: (a: A) => Option<unknown>,
) => (o: Option<A>) => Option<A> = f => o => flatTap_(o, f);

export const flatten: <A>(o: Option<Option<A>>) => Option<A> = o =>
  flatMap_(o, id);

export const fold: <A, B>(
  onNone: () => B,
  onSome: (a: A) => B,
) => (o: Option<A>) => B = (onNone, onSome) => o => fold_(o, onNone, onSome);

// -- Point-ful operators

export const map_ = <A, B>(o: Option<A>, f: (a: A) => B): Option<B> =>
  fold_(o, () => none, flow(f, some));

export const tap_ = <A>(o: Option<A>, f: (a: A) => unknown): Option<A> =>
  map_(o, x => {
    f(x);
    return x;
  });

export const flatMap_ = <A, B>(
  o: Option<A>,
  f: (a: A) => Option<B>,
): Option<B> => fold_(o, () => none, f);

export const flatTap_ = <A>(
  o: Option<A>,
  f: (a: A) => Option<unknown>,
): Option<A> => flatMap_(o, x => map_(f(x), () => x));

export const fold_ = <A, B>(
  o: Option<A>,
  onNone: () => B,
  onSome: (a: A) => B,
): B => {
  const v = view(o);
  if (v.tag === 'some') {
    return onSome(v.value);
  } else {
    return onNone();
  }
};