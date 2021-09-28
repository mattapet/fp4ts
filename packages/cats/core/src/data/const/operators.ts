import { Const } from './const';
import { Monoid } from '../../monoid';

export const retag: <C>() => <A, B>(a: Const<A, B>) => Const<A, C> = () =>
  retag_;

export const combine: <A>(
  A: Monoid<A>,
) => <B2>(
  rhs: Const<A, B2>,
) => <B extends B2>(lhs: Const<A, B>) => Const<A, B2> = A => rhs => lhs =>
  combine_(A)(lhs, rhs);

export const retag_ = <A, B, C>(a: Const<A, B>): Const<A, C> => a;

export const combine_ =
  <A>(A: Monoid<A>) =>
  <B>(lhs: Const<A, B>, rhs: Const<A, B>): Const<A, B> =>
    A.combine_(lhs, () => rhs);