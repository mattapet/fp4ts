import { Kind, AnyK } from '../../core';
import { Concurrent } from './concurrent';

export interface Temporal<F extends AnyK, E> extends Concurrent<F, E> {
  readonly sleep: (ms: number) => Kind<F, [void]>;

  readonly delayBy: <A>(fa: Kind<F, [A]>, ms: number) => Kind<F, [A]>;

  readonly timeoutTo: <A>(
    ioa: Kind<F, [A]>,
    ms: number,
    fallback: Kind<F, [A]>,
  ) => Kind<F, [A]>;

  readonly timeout: <A>(ioa: Kind<F, [A]>, ms: number) => Kind<F, [A]>;
}
