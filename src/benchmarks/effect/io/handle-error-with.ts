import '../../../benchmarking';
import { pipe } from '../../../fp/core';
import { IO } from '../../../effect/io';

const size = 100_000;

pipe(
  benchmark.group('handleErrorWith')(
    benchmark('happy path', async () => {
      const loop = (i: number): IO<number> =>
        i < size
          ? IO.pure(i + 1)
              .handleErrorWith(IO.throwError)
              .flatMap(loop)
          : IO.pure(i);

      await loop(0).unsafeRunToPromise();
    }),

    benchmark('error thrown', async () => {
      const error = new Error('test error');

      const loop = (i: number): IO<number> =>
        i < size
          ? IO.throwError(error)
              .flatMap(x => IO.pure(x + 1))
              .flatMap(x => IO.pure(x + 1))
              .handleErrorWith(() => loop(i + 1))
          : IO.pure(i);

      await loop(0).unsafeRunToPromise();
    }),
  ),
  runBenchmark(),
);