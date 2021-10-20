import fc from 'fast-check';
import { AdditionMonoid, Eval, Eq, List, Vector } from '@cats4ts/cats';
import { Chunk } from '@cats4ts/stream-core';
import { checkAll, forAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/stream-test-kit/lib/arbitraries';
import {
  AlternativeSuite,
  MonadSuite,
  MonoidKSuite,
  TraversableSuite,
} from '@cats4ts/cats-laws';

describe('chunk', () => {
  test(
    'size',
    forAll(
      A.cats4tsStreamChunkGenerator(fc.integer()),
      c => c.size === c.toList.size,
    ),
  );

  test(
    'isEmpty',
    forAll(
      A.cats4tsStreamChunkGenerator(fc.integer()),
      c => c.isEmpty === c.toList.isEmpty,
    ),
  );

  test(
    'take',
    forAll(A.cats4tsStreamChunkGenerator(fc.integer()), fc.integer(), (c, n) =>
      c.take(n).toList['<=>'](c.toList.take(n)),
    )(List.Eq(Eq.primitive)),
  );

  test(
    'takeRight',
    forAll(A.cats4tsStreamChunkGenerator(fc.integer()), fc.integer(), (c, n) =>
      c.takeRight(n).toList['<=>'](c.toList.takeRight(n)),
    )(List.Eq(Eq.primitive)),
  );

  test(
    'drop',
    forAll(A.cats4tsStreamChunkGenerator(fc.integer()), fc.integer(), (c, n) =>
      c.drop(n).toList['<=>'](c.toList.drop(n)),
    )(List.Eq(Eq.primitive)),
  );

  test(
    'dropRight',
    forAll(A.cats4tsStreamChunkGenerator(fc.integer()), fc.integer(), (c, n) =>
      c.dropRight(n).toList['<=>'](c.toList.dropRight(n)),
    )(List.Eq(Eq.primitive)),
  );

  test(
    'concat',
    forAll(
      A.cats4tsStreamChunkGenerator(fc.integer()),
      A.cats4tsStreamChunkGenerator(fc.integer()),
      (c1, c2) =>
        c1['+++'](Chunk.empty)
          ['+++'](c2)
          ['+++'](Chunk.empty)
          .toList['<=>'](c1.toList['+++'](c2.toList)),
    )(List.Eq(Eq.primitive)),
  );

  test(
    'scanLeft',
    forAll(A.cats4tsStreamChunkGenerator(fc.integer()), c => {
      const step = (acc: Vector<number>, next: number): Vector<number> =>
        acc.append(next);
      const init: Vector<number> = Vector.empty;

      return c
        .scanLeft(init, step)
        .toVector['<=>'](c.toVector.scanLeft(init, step));
    })(Vector.Eq(Vector.Eq(Eq.primitive))),
  );

  test(
    'scanLeftCarry',
    forAll(A.cats4tsStreamChunkGenerator(fc.integer()), c => {
      const step = (acc: Vector<number>, next: number): Vector<number> =>
        acc.append(next);
      const init: Vector<number> = Vector.empty;
      const vectorScan = c.toVector.scanLeft(init, step);
      const [chunkScan, carry] = c.scanLeftCarry(init, step);

      return [chunkScan.toVector, carry]['<=>']([
        vectorScan.tail,
        vectorScan.last,
      ] as [Vector<Vector<number>>, Vector<number>]);
    })(Eq.tuple2(Vector.Eq(Vector.Eq(Eq.primitive)), Vector.Eq(Eq.primitive))),
  );

  describe('scanLeftCarry', () => {
    it('should return empty chunk and zero when empty', () => {
      expect(Chunk.empty.scanLeftCarry(0, (x, y) => x + y)).toEqual([
        Chunk.empty,
        0,
      ]);
    });

    it('should return singleton chunk and first result', () => {
      expect(Chunk(2).scanLeftCarry(1, (x, y) => x + y)).toEqual([Chunk(3), 3]);
    });

    it('should chunk with all results and a last result', () => {
      const [chunk, carry] = Chunk(2, 3).scanLeftCarry(1, (x, y) => x + y);
      expect([chunk.toArray, carry]).toEqual([[3, 6], 6]);
    });
  });

  const monoidKTests = MonoidKSuite(Chunk.MonoidK);
  checkAll(
    'MonoidK<Chunk>',
    monoidKTests.monoidK(
      fc.integer(),
      Eq.primitive,
      A.cats4tsStreamChunkGenerator,
      <X>(EqX: Eq<X>) => Eq.by(List.Eq(EqX), (c: Chunk<X>) => c.toList),
    ),
  );

  const alternativeTests = AlternativeSuite(Chunk.Alternative);
  checkAll(
    'Alternative<Chunk>',
    alternativeTests.alternative(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      A.cats4tsStreamChunkGenerator,
      <X>(EqX: Eq<X>) => Eq.by(List.Eq(EqX), (c: Chunk<X>) => c.toList),
    ),
  );

  const monadTests = MonadSuite(Chunk.Monad);
  checkAll(
    'Monad<Chunk>',
    monadTests.monad(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      A.cats4tsStreamChunkGenerator,
      <X>(EqX: Eq<X>) => Eq.by(List.Eq(EqX), (c: Chunk<X>) => c.toList),
    ),
  );

  const traversableTests = TraversableSuite(Chunk.Traversable);
  checkAll(
    'Traversable<Chunk>',
    traversableTests.traversable(
      fc.integer(),
      fc.integer(),
      fc.integer(),
      AdditionMonoid,
      AdditionMonoid,
      Chunk.Functor,
      Eval.Applicative,
      Eval.Applicative,
      Eq.primitive,
      Eq.primitive,
      Eq.primitive,
      A.cats4tsStreamChunkGenerator,
      <X>(EqX: Eq<X>) => Eq.by(List.Eq(EqX), (c: Chunk<X>) => c.toList),
      A.cats4tsEval,
      Eval.Eq,
      A.cats4tsEval,
      Eval.Eq,
    ),
  );
});