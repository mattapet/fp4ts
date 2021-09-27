import { Lazy } from '@cats4ts/core';
import {
  Functor,
  Apply,
  Monad,
  FlatMap,
  Applicative,
  MonadError,
  Defer,
} from '@cats4ts/cats-core';
import {
  Async,
  Concurrent,
  MonadCancel,
  Spawn,
  Sync,
  Temporal,
} from '@cats4ts/effect-kernel';

import { IoK } from './io';
import { IO } from './algebra';
import {
  async,
  async_,
  defer,
  delay,
  fromPromise,
  never,
  pure,
  sleep,
  throwError,
  uncancelable,
  unit,
} from './constructors';
import {
  attempt,
  bothOutcome_,
  both_,
  bracketFull,
  bracketOutcome_,
  bracket_,
  delayBy_,
  executeOn_,
  finalize,
  flatMap_,
  flatTap_,
  flatten,
  fork,
  handleError,
  handleErrorWith,
  handleErrorWith_,
  handleError_,
  map2_,
  map_,
  onCancel,
  onError,
  onError_,
  parSequence,
  parSequenceN,
  parTraverse,
  parTraverseN,
  raceOutcome_,
  racePair_,
  race_,
  redeemWith_,
  redeem_,
  tailRecM_,
  tap_,
  timeoutTo_,
  timeout_,
} from './operators';

export const ioDefer: Lazy<Defer<IoK>> = () => Defer.of({ defer });

export const ioFunctor: Lazy<Functor<IoK>> = () => Functor.of({ map_, tap_ });

export const ioParallelApply: Lazy<Apply<IoK>> = () =>
  Apply.of({
    ...ioFunctor(),
    ap_: (ff, fa) => map2_(ff, fa, (f, a) => f(a)),
    map2_:
      <A, B>(fa: IO<A>, fb: IO<B>) =>
      <C>(f: (a: A, b: B) => C) =>
        map2_(fa, fb, f),
  });

export const ioParallelApplicative: Lazy<Applicative<IoK>> = () =>
  Applicative.of({
    ...ioParallelApply(),
    pure: pure,
    unit,
  });

export const ioSequentialApply: Lazy<Apply<IoK>> = () =>
  Apply.of({
    ...ioFunctor(),
    ap_: (ff, fa) => flatMap_(ff, f => map_(fa, a => f(a))),
  });

export const ioSequentialApplicative: Lazy<Applicative<IoK>> = () =>
  Applicative.of({
    ...ioSequentialApply(),
    pure: pure,
    unit,
  });

export const ioFlatMap: Lazy<FlatMap<IoK>> = () =>
  FlatMap.of({
    ...ioSequentialApply(),
    flatMap_: flatMap_,
    flatTap_: flatTap_,
    flatten: flatten,
    tailRecM_: tailRecM_,
  });

export const ioMonad: Lazy<Monad<IoK>> = () =>
  Monad.of({
    ...ioSequentialApplicative(),
    ...ioFlatMap(),
  });

export const ioMonadError: Lazy<MonadError<IoK, Error>> = () =>
  MonadError.of({
    ...ioMonad(),
    throwError: throwError,
    handleError_: handleError_,
    handleErrorWith_: handleErrorWith_,
    attempt: attempt,
    onError_: onError_,
    redeem_: redeem_,
    redeemWith_: redeemWith_,
  });

export const ioMonadCancel: Lazy<MonadCancel<IoK, Error>> = () => ({
  ...ioMonadError(),
  uncancelable: uncancelable,
  onCancel: onCancel,
  finalize: finalize,
  bracket: fa => use => release => bracket_(fa, use, release),
  bracketOutcome: fa => use => release => bracketOutcome_(fa, use, release),
  bracketFull: acquire => use => release => bracketFull(acquire, use, release),
});

export const ioSync: Lazy<Sync<IoK>> = () => ({
  ...ioMonadError(),
  ...ioDefer(),
  delay: delay,
});

export const ioSpawn: Lazy<Spawn<IoK, Error>> = () => ({
  ...ioMonadCancel(),
  applicative: ioParallelApplicative(),
  fork: fork,
  never: never,
  suspend: null as any,
  racePair: racePair_,
  raceOutcome: raceOutcome_,
  race: race_,
  both: both_,
  bothOutcome: bothOutcome_,
});

export const ioConcurrent: Lazy<Concurrent<IoK, Error>> = () => ({
  ...ioSpawn(),
  parTraverse: parTraverse,
  parSequence: parSequence,

  parTraverseN: parTraverseN,
  parSequenceN: parSequenceN,
});

export const ioTemporal: Lazy<Temporal<IoK, Error>> = () => ({
  ...ioConcurrent(),
  sleep: sleep,
  delayBy: delayBy_,
  timeoutTo: timeoutTo_,
  timeout: timeout_,
});

export const ioAsync: Lazy<Async<IoK>> = () => ({
  ...ioSync(),
  ...ioTemporal(),
  async: async,
  async_: async_,
  never: never,
  executeOn: executeOn_,
  fromPromise: fromPromise,
});