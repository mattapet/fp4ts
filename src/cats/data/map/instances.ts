import { $ } from '../../../core';
import { Functor } from '../../functor';
import { FunctorFilter } from '../../functor-filter';
import { Foldable } from '../../foldable';
import { Traversable } from '../../traversable';

import { MapK } from './map';
import {
  all_,
  any_,
  collect_,
  count_,
  foldLeft_,
  foldMap_,
  foldRight_,
  isEmpty,
  map_,
  nonEmpty,
  sequence,
  size,
  traverse_,
} from './operators';

export const mapFunctor: <K>() => Functor<$<MapK, [K]>> = () =>
  Functor.of({ map_ });

export const mapFunctorFilter: <K>() => FunctorFilter<$<MapK, [K]>> = () =>
  FunctorFilter.of({
    ...mapFunctor(),
    mapFilter_: collect_,
  });

export const mapFoldable: <K>() => Foldable<$<MapK, [K]>> = () =>
  Foldable.of({
    foldLeft_: foldLeft_,
    foldRight_: foldRight_,
    foldMap_: foldMap_,
    all_: all_,
    any_: any_,
    count_: count_,
    isEmpty: isEmpty,
    nonEmpty: nonEmpty,
    size: size,
  });

export const mapTraversable: <K>() => Traversable<$<MapK, [K]>> = () =>
  Traversable.of({
    ...mapFunctor(),
    ...mapFoldable(),

    traverse_: traverse_,
    sequence: sequence,
  });
