import { Kind, id, AnyK } from '../core';
import { Functor, FunctorRequirements } from './functor';
import { Option, Some, None } from './data/option';

export interface FunctorFilter<F extends AnyK> extends Functor<F> {
  readonly mapFilter: <A, B>(
    f: (a: A) => Option<B>,
  ) => (fa: Kind<F, [A]>) => Kind<F, [B]>;
  readonly mapFilter_: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Option<B>,
  ) => Kind<F, [B]>;

  readonly collect: <A, B>(
    f: (a: A) => Option<B>,
  ) => (fa: Kind<F, [A]>) => Kind<F, [B]>;
  readonly collect_: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Option<B>,
  ) => Kind<F, [B]>;

  readonly flattenOption: <A>(ffa: Kind<F, [Option<A>]>) => Kind<F, [A]>;

  readonly filter: <A>(
    p: (a: A) => boolean,
  ) => (fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly filter_: <A>(fa: Kind<F, [A]>, p: (a: A) => boolean) => Kind<F, [A]>;

  readonly filterNot: <A>(
    p: (a: A) => boolean,
  ) => (fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly filterNot_: <A>(
    fa: Kind<F, [A]>,
    p: (a: A) => boolean,
  ) => Kind<F, [A]>;
}

export type FunctorFilterRequirements<F extends AnyK> = Pick<
  FunctorFilter<F>,
  'mapFilter_'
> &
  FunctorRequirements<F> &
  Partial<FunctorFilter<F>>;

export const FunctorFilter = Object.freeze({
  of: <F extends AnyK>(F: FunctorFilterRequirements<F>): FunctorFilter<F> => {
    const self: FunctorFilter<F> = {
      mapFilter: f => fa => self.mapFilter_(fa, f),

      collect: f => fa => self.mapFilter_(fa, f),
      collect_: (fa, f) => self.mapFilter_(fa, f),

      flattenOption: fa => self.collect_(fa, id),

      filter: f => fa => self.filter_(fa, f),
      filter_: (fa, p) => self.collect_(fa, x => (p(x) ? Some(x) : None)),

      filterNot: f => fa => self.filterNot_(fa, f),
      filterNot_: (fa, p) => self.filter_(fa, x => !p(x)),

      ...Functor.of<F>(F),
      ...F,
    };
    return self;
  },
});