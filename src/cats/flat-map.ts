import { id, Kind, AnyK } from '../core';
import { Apply } from './apply';

export interface FlatMap<F extends AnyK> extends Apply<F> {
  readonly flatMap: <A, B>(
    f: (a: A) => Kind<F, [B]>,
  ) => (fa: Kind<F, [A]>) => Kind<F, [B]>;
  readonly flatMap_: <A, B>(
    fa: Kind<F, [A]>,
    f: (a: A) => Kind<F, [B]>,
  ) => Kind<F, [B]>;

  readonly flatTap: <A>(
    f: (a: A) => Kind<F, [unknown]>,
  ) => (fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly flatTap_: <A>(
    fa: Kind<F, [A]>,
    f: (a: A) => Kind<F, [unknown]>,
  ) => Kind<F, [A]>;

  readonly flatten: <A>(ffa: Kind<F, [Kind<F, [A]>]>) => Kind<F, [A]>;
}

export type FlatMapRequirements<F extends AnyK> = Pick<
  FlatMap<F>,
  'flatMap_' | 'map_'
> &
  Partial<FlatMap<F>>;
export const FlatMap = Object.freeze({
  of: <F extends AnyK>(F: FlatMapRequirements<F>): FlatMap<F> => {
    const self: FlatMap<F> = {
      flatMap: f => fa => self.flatMap_(fa, f),

      flatTap: f => fa => self.flatTap_(fa, f),

      flatTap_: (fa, f) => self.flatMap_(fa, x => self.map_(f(x), () => x)),

      flatten: ffa => self.flatMap_(ffa, id),

      ...FlatMap.deriveApply(F),
      ...F,
    };

    return self;
  },

  deriveApply: <F extends AnyK>(F: FlatMapRequirements<F>): Apply<F> =>
    Apply.of<F>({
      ap_: (ff, fa) => F.flatMap_(ff, f => F.map_(fa, a => f(a))),
      ...F,
    }),
});
