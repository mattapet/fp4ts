module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: './packages',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  roots: [
    '<rootDir>/cats/core/src',
    '<rootDir>/cats/free/src',
    '<rootDir>/core/src',
    '<rootDir>/effect/core/src',
    '<rootDir>/effect/kernel/src',
    '<rootDir>/effect/std/src',
  ],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@cats4ts/cats-core$': '<rootDir>/cats/core/src',
    '^@cats4ts/cats-core/lib/(.*)$': '<rootDir>/cats/core/src/$1/',
    '^@cats4ts/cats-free$': '<rootDir>/cats/free/src',
    '^@cats4ts/cats-free/lib/(.*)$': '<rootDir>/cats/free/src/$1/',
    '^@cats4ts/core$': '<rootDir>/core/src',
    '^@cats4ts/core/lib/(.*)$': '<rootDir>/core/src/$1/',
    '^@cats4ts/effect-core$': '<rootDir>/effect/core/src',
    '^@cats4ts/effect-core/lib/(.*)$': '<rootDir>/effect/core/src/$1/',
    '^@cats4ts/effect-kernel$': '<rootDir>/effect/kernel/src',
    '^@cats4ts/effect-kernel/lib/(.*)$': '<rootDir>/effect/kernel/src/$1/',
    '^@cats4ts/effect-std$': '<rootDir>/effect/std/src',
    '^@cats4ts/effect-std/lib/(.*)$': '<rootDir>/effect/std/src/$1/',
    '^@cats4ts/effect-test-kit$': '<rootDir>/effect/test-kit/src',
    '^@cats4ts/effect-test-kit/lib/(.*)$': '<rootDir>/effect/test-kit/src/$1/',
    '^@cats4ts/stream-core$': '<rootDir>/effect/stream-core/src',
    '^@cats4ts/stream-core/lib/(.*)$': '<rootDir>/effect/stream-core/src/$1/',
  },
};
