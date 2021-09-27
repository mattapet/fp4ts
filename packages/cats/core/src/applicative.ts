import { Kind, AnyK } from '@cats4ts/core';
import { Functor } from './functor';
import { Apply } from './apply';
import { ComposedApplicative } from './composed';

export interface Applicative<F extends AnyK> extends Apply<F> {
  readonly pure: <A>(a: A) => Kind<F, [A]>;
  readonly unit: Kind<F, [void]>;
}

export type ApplicativeRequirements<F extends AnyK> = Pick<
  Applicative<F>,
  'pure' | 'ap_'
> &
  Partial<Applicative<F>>;
export const Applicative = Object.freeze({
  of: <F extends AnyK>(F: ApplicativeRequirements<F>): Applicative<F> => {
    const self: Applicative<F> = {
      unit: F.pure(undefined as void),

      ...Apply.of<F>({ ...Applicative.deriveFunctor<F>(F), ...F }),
      ...F,
    };
    return self;
  },

  compose: <F extends AnyK, G extends AnyK>(
    F: Applicative<F>,
    G: Applicative<G>,
  ): ComposedApplicative<F, G> => ComposedApplicative.of(F, G),

  deriveFunctor: <F extends AnyK>(F: ApplicativeRequirements<F>): Functor<F> =>
    Functor.of<F>({
      map_: (fa, f) => F.ap_(F.pure(f), fa),
      ...F,
    }),
});