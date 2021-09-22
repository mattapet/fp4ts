import { MonadError } from '@cats4ts/cats-core';
import { TyK, _ } from '@cats4ts/core';
import { Sync } from '@cats4ts/effect-kernel';

import { SyncIO as SyncIOBase } from './algebra';
import { defer, delay, pure, throwError } from './constructors';
import { syncIoMonadError, syncIoSync } from './instances';

export type SyncIO<A> = SyncIOBase<A>;

export const SyncIO: SyncIOObj = function <A>(thunk: () => A): SyncIO<A> {
  return delay(thunk);
} as any;

interface SyncIOObj {
  <A>(thunk: () => A): SyncIO<A>;
  pure<A>(a: A): SyncIO<A>;
  delay<A>(thunk: () => A): SyncIO<A>;
  defer<A>(thunk: () => SyncIO<A>): SyncIO<A>;
  throwError(e: Error): SyncIO<never>;

  // -- Instances

  readonly MonadError: MonadError<SyncIoK, Error>;
  readonly Sync: Sync<SyncIoK>;
}

SyncIO.pure = pure;
SyncIO.delay = delay;
SyncIO.defer = defer;
SyncIO.throwError = throwError;

Object.defineProperty(SyncIO, 'MonadError', {
  get() {
    return syncIoMonadError();
  },
});
Object.defineProperty(SyncIO, 'Sync', {
  get() {
    return syncIoSync();
  },
});

// -- HKT

export const SyncIoURI = 'cats4ts/effect/sync-io';
export type SyncIoURI = typeof SyncIoURI;
export type SyncIoK = TyK<SyncIoURI, [_]>;

declare module '@cats4ts/core/lib/hkt/hkt' {
  interface URItoKind<Tys extends unknown[]> {
    [SyncIoURI]: SyncIO<Tys[0]>;
  }
}
