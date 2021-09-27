import { IdentityK } from '../identity';
import { Kleisli } from '../kleisli';

export class Reader<R, A> {
  private readonly __void!: void;

  private readonly _R!: (_: R) => void;

  public constructor(public readonly _kleisli: Kleisli<IdentityK, R, A>) {}
}