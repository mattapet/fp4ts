import * as E from '../../fp/either';

import { IO } from '../io';
import { ExecutionContext, GlobalExecutionContext } from '../execution-context';

import * as O from '../kernel/outcome';
import { IORuntimeConfig } from './io-runtime-config';
import { PlatformConfig } from './io-platform';

export class IORuntime {
  public constructor(
    public readonly executionContext: ExecutionContext,
    public readonly shutdown: () => void,
    public readonly config: IORuntimeConfig,
  ) {}

  private static _global?: IORuntime;

  public static get global(): IORuntime {
    if (!this._global) {
      this._global = new IORuntime(GlobalExecutionContext, () => {}, {
        autoSuspendThreshold: PlatformConfig.AUTO_SUSPEND_THRESHOLD,
      });
    }
    return this._global;
  }
}

const listenForSignal = (s: string): IO<void> =>
  IO.async(resume =>
    IO(() => {
      const listener = () => resume(E.rightUnit);
      const removeListener = () => {
        process.removeListener(s, listener);
      };

      process.on(s, listener);
      return IO(removeListener);
    }),
  );

export const Signal = Object.freeze({
  SIGTERM: () => listenForSignal('SIGTERM'),
  SIGINT: () => listenForSignal('SIGINT'),
});

export const unsafeRunMain = (ioa: IO<unknown>): void => {
  const runtime = IORuntime.global;
  const onCancel = () => IO(() => process.exit(2));
  const onFailure = () => IO(() => process.exit(1));
  const onSuccess = () => IO(() => process.exit(0));

  return ioa
    .race(IO.race(Signal.SIGTERM(), Signal.SIGINT()))
    .finalize(O.fold(onCancel, onFailure, E.fold(onSuccess, onCancel)))
    .unsafeRunAsync(() => {}, runtime);
};