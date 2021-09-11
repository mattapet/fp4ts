import { id } from '../../../fp/core';
import { FlatMap, Pure, Reader, view } from './algebra';
import { pure } from './constructors';

export const map: <A, B>(
  f: (a: A) => B,
) => <R>(fa: Reader<R, A>) => Reader<R, B> = f => fa => map_(fa, f);

export const tap: <A>(
  f: (a: A) => unknown,
) => <R>(fa: Reader<R, A>) => Reader<R, A> = f => fa => tap_(fa, f);

export const ap: <R2, A>(
  fa: Reader<R2, A>,
) => <R1, B>(ff: Reader<R1, (a: A) => B>) => Reader<R1 & R2, B> = fa => ff =>
  ap_(ff, fa);

export const map2: <R2, A, B, C>(
  fb: Reader<R2, B>,
  f: (a: A, b: B) => C,
) => <R1>(fa: Reader<R1, A>) => Reader<R1 & R2, C> = (fb, f) => fa =>
  map2_(fa, fb)(f);

export const product: <R2, A, B>(
  fb: Reader<R2, B>,
) => <R1>(fa: Reader<R1, A>) => Reader<R1 & R2, [A, B]> = fb => fa =>
  product_(fa, fb);

export const productL: <R2, A, B>(
  fb: Reader<R2, B>,
) => <R1>(fa: Reader<R1, A>) => Reader<R1 & R2, A> = fb => fa =>
  productL_(fa, fb);

export const productR: <R2, A, B>(
  fb: Reader<R2, B>,
) => <R1>(fa: Reader<R1, A>) => Reader<R1 & R2, B> = fb => fa =>
  productR_(fa, fb);

export const flatMap: <R2, A, B>(
  f: (a: A) => Reader<R2, B>,
) => <R1>(fa: Reader<R1, A>) => Reader<R1 & R2, B> = f => fa => flatMap_(fa, f);

export const flatTap: <R2, A>(
  f: (a: A) => Reader<R2, unknown>,
) => <R1>(fa: Reader<R1, A>) => Reader<R1 & R2, A> = f => fa => flatTap_(fa, f);

export const flatten = <R1, R2, A>(
  ffa: Reader<R1, Reader<R2, A>>,
): Reader<R1 & R2, A> => flatMap_(ffa, id);

export const runReader: <R>(r: R) => <A>(fa: Reader<R, A>) => A = r => fa =>
  runReader_(fa, r);

// -- Point-ful operators

export const map_ = <R, A, B>(fa: Reader<R, A>, f: (a: A) => B): Reader<R, B> =>
  flatMap_(fa, x => pure(f(x)));

export const tap_ = <R, A>(
  fa: Reader<R, A>,
  f: (a: A) => unknown,
): Reader<R, A> =>
  map_(fa, x => {
    f(x);
    return x;
  });

export const ap_ = <R1, R2, A, B>(
  ff: Reader<R1, (a: A) => B>,
  fa: Reader<R2, A>,
): Reader<R1 & R2, B> => flatMap_(ff, f => map_(fa, a => f(a)));

export const map2_ =
  <R1, R2, A, B>(
    fa: Reader<R1, A>,
    fb: Reader<R2, B>,
  ): (<C>(f: (a: A, b: B) => C) => Reader<R1 & R2, C>) =>
  f =>
    flatMap_(fa, a => map_(fb, b => f(a, b)));

export const product_ = <R1, R2, A, B>(
  fa: Reader<R1, A>,
  fb: Reader<R2, B>,
): Reader<R1 & R2, [A, B]> => flatMap_(fa, a => map_(fb, b => [a, b]));

export const productL_ = <R1, R2, A, B>(
  fa: Reader<R1, A>,
  fb: Reader<R2, B>,
): Reader<R1 & R2, A> => flatMap_(fa, a => map_(fb, () => a));

export const productR_ = <R1, R2, A, B>(
  fa: Reader<R1, A>,
  fb: Reader<R2, B>,
): Reader<R1 & R2, B> => flatMap_(fa, () => map_(fb, b => b));

export const flatMap_ = <R1, R2, A, B>(
  fa: Reader<R1, A>,
  f: (a: A) => Reader<R2, B>,
): Reader<R1 & R2, B> => new FlatMap(fa, f);

export const flatTap_ = <R1, R2, A>(
  fa: Reader<R1, A>,
  f: (a: A) => Reader<R2, unknown>,
): Reader<R1 & R2, A> => flatMap_(fa, x => map_(f(x), () => x));

export const runReader_ = <R, A>(fa: Reader<R, A>, r: R): A => {
  type Frame = (a: unknown) => Reader<unknown, unknown>;
  let _cur: Reader<unknown, unknown> = fa;
  let env: unknown = r;
  const stack: Frame[] = [];

  while (true) {
    const cur = view(_cur);

    switch (cur.tag) {
      case 'pure': {
        const next = stack.pop();
        if (!next) return cur.value as A;
        _cur = next(cur.value);
        continue;
      }

      case 'flatMap':
        stack.push(cur.f);
        _cur = cur.self;
        continue;

      case 'provide':
        env = cur.environment;
        _cur = new Pure(undefined);
        continue;

      case 'read':
        _cur = new Pure(env);
        continue;
    }
  }
};
