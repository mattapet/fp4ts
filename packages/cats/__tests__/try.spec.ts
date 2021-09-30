import fc from 'fast-check';
import { throwError } from '@cats4ts/core';
import { Eq } from '@cats4ts/cats-core';
import {
  Try,
  Success,
  Failure,
  Some,
  None,
  Left,
  Right,
} from '@cats4ts/cats-core/lib/data';
import {
  FunctorFilterSuite,
  MonadErrorSuite,
  SemigroupKSuite,
} from '@cats4ts/cats-laws';
import { checkAll } from '@cats4ts/cats-test-kit';
import * as A from '@cats4ts/cats-test-kit/lib/arbitraries';

describe('Try', () => {
  describe('type', () => {
    it('should be covariant', () => {
      const t1: Try<never> = Failure(new Error('test error'));
      const t2: Try<number> = t1;
    });
  });

  describe('constructors', () => {
    it('should create a success value', () => {
      expect(Try(() => 42)).toEqual(Success(42));
    });

    it('should create a failure value when throws', () => {
      expect(Try(() => throwError(new Error('test error')))).toEqual(
        Failure(new Error('test error')),
      );
    });

    it('should create a success value from a Some', () => {
      expect(Try.fromOption(Some(42))).toEqual(Success(42));
    });

    it('should create a Failure value from a None', () => {
      expect(Try.fromOption(None)).toEqual(Failure(new Error('Option.empty')));
    });

    it('should create a success value from right', () => {
      expect(Try.fromEither(Right(42))).toEqual(Success(42));
    });

    it('should create a failure value from left', () => {
      expect(Try.fromEither(Left(new Error('test error')))).toEqual(
        Failure(new Error('test error')),
      );
    });
  });

  describe('accessors', () => {
    it('should be success', () => {
      expect(Success(42).isSuccess).toBe(true);
    });

    it('should be failure', () => {
      expect(Failure(new Error('error')).isFailure).toBe(true);
    });

    it('should return success value when present', () => {
      expect(Success(42).get).toBe(42);
    });

    it('should throw when it is failure', () => {
      expect(() => Failure(new Error('test error')).get).toThrow(
        new Error('test error'),
      );
    });

    it('should create Some from success', () => {
      expect(Success(42).toOption).toEqual(Some(42));
    });

    it('should create None from failure', () => {
      expect(Failure(new Error('test error')).toOption).toEqual(None);
    });

    it('should create Right from success', () => {
      expect(Success(42).toEither).toEqual(Right(42));
    });

    it('should create Left from failure', () => {
      expect(Failure(new Error('test error')).toEither).toEqual(
        Left(new Error('test error')),
      );
    });
  });

  describe('getOrElse', () => {
    it('should return the success value', () => {
      expect(Success(42).getOrElse(() => 43)).toBe(42);
    });

    it('should return default value when failure', () => {
      expect(Failure(new Error('test error')).getOrElse(() => 43)).toBe(43);
    });
  });

  describe('map', () => {
    it('should transform the success value', () => {
      expect(Success(42).map(x => x * 2)).toEqual(Success(84));
    });

    it('should ignore the failure value', () => {
      expect(Failure(new Error('test error')).map(x => x * 2)).toEqual(
        Failure(new Error('test error')),
      );
    });

    it('should capture the exception thrown in transformer', () => {
      expect(
        Success(42).map(x => throwError(new Error('test error2'))),
      ).toEqual(Failure(new Error('test error2')));
    });
  });

  describe('collect', () => {
    it('should transform the value', () => {
      expect(Success(42).collect(Some)).toEqual(Success(42));
    });

    it('should transform the failure when predicate fails', () => {
      expect(Success(42).collect(() => None)).toEqual(
        Failure(new Error('Predicate does not hold')),
      );
    });
  });

  describe('getOrElse', () => {
    it('should return the wrapped value when success', () => {
      expect(Success(42)['<|>'](() => Success(43))).toEqual(Success(42));
    });

    it('should return the default value when failure', () => {
      expect(
        Failure(new Error('test error'))['<|>'](() => Success(43)),
      ).toEqual(Success(43));
    });

    it('should return the failure when both wrapped and default values are failure', () => {
      expect(
        Failure(new Error('test error 1'))['<|>'](() =>
          Failure(new Error('test error 2')),
        ),
      ).toEqual(Failure(new Error('test error 2')));
    });
  });

  describe('flatMap', () => {
    it('should transform the value', () => {
      expect(Success(42).flatMap(x => Success(x + 1))).toEqual(Success(43));
    });

    it('should return failure when success value mapped into value', () => {
      expect(
        Success(42).flatMap(() => Failure(new Error('test error'))),
      ).toEqual(Failure(new Error('test error')));
    });

    it('should ignore the transformation when value is failure', () => {
      expect(
        Failure(new Error('test error')).flatMap(() => Success(42)),
      ).toEqual(Failure(new Error('test error')));
    });

    it('should capture error thrown in the transformer', () => {
      expect(
        Success(42).flatMap(() => throwError(new Error('test error'))),
      ).toEqual(Failure(new Error('test error')));
    });
  });

  describe('flatten', () => {
    it('should flatten double success into a success', () => {
      expect(Success(Success(42)).flatten).toEqual(Success(42));
    });

    it('should flatten failure wrapped in success into a failure', () => {
      expect(Success(Failure(new Error('test error'))).flatten).toEqual(
        Failure(new Error('test error')),
      );
    });
  });

  describe('recoverWith', () => {
    it('should pass underlying value without modification', () => {
      expect(Success(42).recover(() => 43)).toEqual(Success(42));
    });

    it('should recover from value to success with given value', () => {
      expect(Failure(new Error('test error')).recover(() => 43)).toEqual(
        Success(43),
      );
    });

    it('should capture error thrown in recovery function', () => {
      expect(
        Failure(new Error('test error')).recover(() =>
          throwError(new Error('test error2')),
        ),
      ).toEqual(Failure(new Error('test error2')));
    });
  });

  describe('recoverWith', () => {
    it('should pass underlying value without modification', () => {
      expect(Success(42).recoverWith(() => Success(43))).toEqual(Success(42));
    });

    it('should recover from failure to success with given value', () => {
      expect(
        Failure(new Error('test error')).recoverWith(() => Success(43)),
      ).toEqual(Success(43));
    });

    it('should recover from failure to failure', () => {
      expect(
        Failure(new Error('test error')).recoverWith(() =>
          Failure(new Error('test error2')),
        ),
      ).toEqual(Failure(new Error('test error2')));
    });

    it('should capture error thrown in recovery function', () => {
      expect(
        Failure(new Error('test error')).recoverWith(() =>
          throwError(new Error('test error2')),
        ),
      ).toEqual(Failure(new Error('test error2')));
    });
  });

  const semigroupKTests = SemigroupKSuite(Try.SemigroupK);
  checkAll(
    'SemigroupK<Try>',
    semigroupKTests.semigroupK(
      A.cats4tsTry(fc.integer()),
      Try.Eq(Eq.Error.allEqual, Eq.primitive),
    ),
  );

  const functorFilterTests = FunctorFilterSuite(Try.FunctorFilter);
  checkAll(
    'FunctorFilter<Try>',
    functorFilterTests.functorFilter(
      A.cats4tsTry(fc.integer()),
      A.cats4tsTry(A.cats4tsOption(fc.integer())),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      Try.Eq(Eq.Error.allEqual, Eq.primitive),
      Try.Eq(Eq.Error.allEqual, Eq.primitive),
      Try.Eq(Eq.Error.allEqual, Eq.primitive),
    ),
  );

  const monadErrorTests = MonadErrorSuite(Try.MonadError);
  checkAll(
    'MonadError<Try>',
    monadErrorTests.monadError(
      A.cats4tsTry(fc.integer()),
      A.cats4tsTry(fc.integer()),
      A.cats4tsTry(fc.integer()),
      A.cats4tsTry(fc.integer()),
      A.cats4tsTry(fc.func<[number], number>(fc.integer())),
      A.cats4tsTry(fc.func<[number], number>(fc.integer())),
      fc.integer(),
      fc.integer(),
      fc.integer(),
      A.cats4tsError(),
      Try.Eq(Eq.Error.allEqual, Eq.primitive),
      Try.Eq(Eq.Error.allEqual, Eq.primitive),
      Try.Eq(Eq.Error.allEqual, Eq.primitive),
      Eq.primitive,
      Eq.Error.strict,
      E => Try.Eq(Eq.Error.allEqual, E),
    ),
  );
});