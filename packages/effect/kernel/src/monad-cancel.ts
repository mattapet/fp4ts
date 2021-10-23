import { $ } from '@cats4ts/core';
import { id, Kind, pipe } from '@cats4ts/core';
import {
  Kleisli,
  KleisliK,
  MonadError,
  MonadErrorRequirements,
} from '@cats4ts/cats';
import { Outcome } from './outcome';
import { Poll } from './poll';

export interface MonadCancel<F, E> extends MonadError<F, E> {
  readonly canceled: Kind<F, [void]>;

  readonly uncancelable: <A>(
    body: (poll: Poll<F>) => Kind<F, [A]>,
  ) => Kind<F, [A]>;

  readonly onCancel: (
    fin: Kind<F, [void]>,
  ) => <A>(fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly onCancel_: <A>(
    fa: Kind<F, [A]>,
    fin: Kind<F, [void]>,
  ) => Kind<F, [A]>;

  readonly finalize: <A>(
    finalizer: (oc: Outcome<F, E, A>) => Kind<F, [void]>,
  ) => (fa: Kind<F, [A]>) => Kind<F, [A]>;
  readonly finalize_: <A>(
    fa: Kind<F, [A]>,
    finalizer: (oc: Outcome<F, E, A>) => Kind<F, [void]>,
  ) => Kind<F, [A]>;

  readonly bracket: <A, B>(
    use: (a: A) => Kind<F, [B]>,
  ) => (
    release: (a: A) => Kind<F, [void]>,
  ) => (fa: Kind<F, [A]>) => Kind<F, [B]>;
  readonly bracket_: <A, B>(
    ioa: Kind<F, [A]>,
    use: (a: A) => Kind<F, [B]>,
    release: (a: A) => Kind<F, [void]>,
  ) => Kind<F, [B]>;

  readonly bracketOutcome: <A, B>(
    use: (a: A) => Kind<F, [B]>,
  ) => (
    release: (a: A, oc: Outcome<F, E, B>) => Kind<F, [void]>,
  ) => (fa: Kind<F, [A]>) => Kind<F, [B]>;
  readonly bracketOutcome_: <A, B>(
    ioa: Kind<F, [A]>,
    use: (a: A) => Kind<F, [B]>,
    release: (a: A, oc: Outcome<F, E, B>) => Kind<F, [void]>,
  ) => Kind<F, [B]>;

  readonly bracketFull: <A, B>(
    acquire: (poll: Poll<F>) => Kind<F, [A]>,
    use: (a: A) => Kind<F, [B]>,
    release: (a: A, oc: Outcome<F, E, B>) => Kind<F, [void]>,
  ) => Kind<F, [B]>;
}

export type MonadCancelRequirements<F, E> = Pick<
  MonadCancel<F, E>,
  'canceled' | 'uncancelable' | 'onCancel_'
> &
  MonadErrorRequirements<F, E> &
  Partial<MonadCancel<F, E>>;

export const MonadCancel = Object.freeze({
  of: <F, E>(F: MonadCancelRequirements<F, E>): MonadCancel<F, E> => {
    const self: MonadCancel<F, E> = {
      onCancel: fin => fa => self.onCancel_(fa, fin),

      finalize: fin => fa => self.finalize_(fa, fin),
      finalize_: (fa, fin) =>
        self.uncancelable(poll => {
          const finalized = self.onCancel_(poll(fa), fin(Outcome.canceled()));
          const handled = self.onError_(finalized, e =>
            self.handleError_(fin(Outcome.failure(e)), () => {}),
          );
          return self.flatTap_(handled, a =>
            fin(Outcome.success(self.pure(a))),
          );
        }),

      bracket: use => release => acquire =>
        self.bracket_(acquire, use, release),

      bracket_: (acquire, use, release) =>
        self.bracketOutcome_(acquire, use, a => release(a)),

      bracketOutcome: use => release => acquire =>
        self.bracketOutcome_(acquire, use, release),
      bracketOutcome_: (acquire, use, release) =>
        self.bracketFull(() => acquire, use, release),

      bracketFull: (acquire, use, release) =>
        self.uncancelable(poll =>
          pipe(
            acquire(poll),
            self.flatMap(a =>
              self.finalize_(poll(self.flatMap_(self.unit, () => use(a))), oc =>
                release(a, oc),
              ),
            ),
          ),
        ),

      ...MonadError.of(F),
      ...F,
    };
    return self;
  },

  Uncancelable: <F, E>(F: MonadErrorRequirements<F, E>): MonadCancel<F, E> =>
    MonadCancel.of({
      canceled: F.unit ?? F.pure(undefined),

      onCancel_: (fa, fin) => fa,

      uncancelable: body => body(id),

      ...F,
    }),

  monadCancelForKleisli: <F, R, E>(
    F: MonadCancel<F, E>,
  ): MonadCancel<$<KleisliK, [F, R]>, E> =>
    MonadCancel.of({
      ...Kleisli.MonadError(F),

      onCancel_: (fa, fin) => Kleisli(r => F.onCancel_(fa.run(r), fin.run(r))),

      canceled: Kleisli.liftF(F.canceled),

      uncancelable: <A>(
        body: (poll: Poll<$<KleisliK, [F, R]>>) => Kleisli<F, R, A>,
      ): Kleisli<F, R, A> =>
        Kleisli(r =>
          F.uncancelable(nat => {
            const natT: Poll<$<KleisliK, [F, R]>> = <X>(
              frx: Kleisli<F, R, X>,
            ): Kleisli<F, R, X> => Kleisli(r => nat(frx.run(r)));

            return body(natT).run(r);
          }),
        ),
    }),
});
