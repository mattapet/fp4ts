import '../../benchmarking';
import { pipe } from '@cats4ts/core';
import { Stream } from '@cats4ts/stream-core';

pipe(
  benchmark('zipping', () => {
    const xs = [...new Array(10_000).keys()];
    Stream.fromArray(xs).flatMap(Stream).zip(Stream(1).repeat).compile.toList;
  }),
  runBenchmark({ iterations: 1, warmup: 0 }),
);