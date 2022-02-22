// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { flow, Kind, Lazy, lazyVal, pipe, tupled } from '@fp4ts/core';
import { AndThen, Either, Eval, EvalF, List, Monad, Option } from '@fp4ts/cats';

import { ParseError } from '../parse-error';
import { SourcePosition } from '../source-position';

import { Stream } from '../stream';
import { FlatMap, Map, OrElse, ParserT, View } from './algebra';
import { Consumed } from './consumed';
import { Failure, ParseResult, Success } from './parse-result';
import { State } from './state';
import { succeed } from './constructors';
import { TokenType } from '../token-type';
import { StringSource } from '../string-source';
import { Source } from '../source';

export const map_ = <S, M, A, B>(
  p: ParserT<S, M, A>,
  f: (a: A) => B,
): ParserT<S, M, B> => new Map(p, f);

export const orElse_ = <S, M, A>(
  p1: ParserT<S, M, A>,
  p2: Lazy<ParserT<S, M, A>>,
): ParserT<S, M, A> => new OrElse(p1, lazyVal(p2));

export const ap_ = <S, M, A, B>(
  pf: ParserT<S, M, (a: A) => B>,
  pa: ParserT<S, M, A>,
): ParserT<S, M, B> => map2_(pf, pa)((f, a) => f(a));

export const map2_ =
  <S, M, A, B>(p1: ParserT<S, M, A>, p2: ParserT<S, M, B>) =>
  <C>(f: (a: A, b: B) => C): ParserT<S, M, C> =>
    flatMap_(p1, a => map_(p2, b => f(a, b)));

export const product_ = <S, M, A, B>(
  p1: ParserT<S, M, A>,
  p2: ParserT<S, M, B>,
): ParserT<S, M, [A, B]> => map2_(p1, p2)(tupled);

export const productL_ = <S, M, A, B>(
  p1: ParserT<S, M, A>,
  p2: ParserT<S, M, B>,
): ParserT<S, M, A> => map2_(p1, p2)(a => a);

export const productR_ = <S, M, A, B>(
  p1: ParserT<S, M, A>,
  p2: ParserT<S, M, B>,
): ParserT<S, M, B> => map2_(p1, p2)((_, b) => b);

export const flatMap_ = <S, M, A, B>(
  pa: ParserT<S, M, A>,
  f: (a: A) => ParserT<S, M, B>,
): ParserT<S, M, B> => new FlatMap(pa, f);

export const rep_ = <S, M, A>(pa: ParserT<S, M, A>): ParserT<S, M, List<A>> =>
  orElse_(rep1_(pa), () => succeed(List.empty));

export const rep1_ = <S, M, A>(pa: ParserT<S, M, A>): ParserT<S, M, List<A>> =>
  flatMap_(pa, x => map_(rep_(pa), xs => xs.prepend(x)));

export const sepBy_ = <S, M, A>(
  pa: ParserT<S, M, A>,
  tok: ParserT<S, M, TokenType<S>>,
): ParserT<S, M, List<A>> =>
  orElse_(sepBy1_(pa, tok), () => succeed(List.empty));

export const sepBy1_ = <S, M, A>(
  pa: ParserT<S, M, A>,
  tok: ParserT<S, M, TokenType<S>>,
): ParserT<S, M, List<A>> =>
  flatMap_(pa, x => map_(rep_(productR_(tok, pa)), xs => xs.prepend(x)));

// -- Parsing functions

export const parse = <A>(
  p: ParserT<StringSource, EvalF, A>,
  s: string,
): Either<ParseError, A> => parseSource(p, StringSource.fromString(s));

export const parseF =
  <M>(M: Monad<M>) =>
  <A>(
    p: ParserT<StringSource, M, A>,
    s: string,
  ): Kind<M, [Either<ParseError, A>]> =>
    parseSourceF(M)(p, StringSource.fromString(s));

export const parseSource = <A, S extends Source<any, any>>(
  p: ParserT<S, EvalF, A>,
  s: S,
): Either<ParseError, A> =>
  parseStream(Stream.forSource<EvalF, S>(Eval.Monad))(p, s);

export const parseSourceF =
  <M>(M: Monad<M>) =>
  <A, S extends Source<any, any>>(
    p: ParserT<S, M, A>,
    s: S,
  ): Kind<M, [Either<ParseError, A>]> =>
    parseStreamF(Stream.forSource<M, S>(M), M)(p, s);

export const parseStream =
  <S>(S: Stream<S, EvalF>) =>
  <A>(p: ParserT<S, EvalF, A>, s: S): Either<ParseError, A> =>
    parseStreamF(S, Eval.Monad)(p, s).value;

export const parseStreamF =
  <S, M>(S: Stream<S, M>, M: Monad<M>) =>
  <A>(p: ParserT<S, M, A>, s: S): Kind<M, [Either<ParseError, A>]> =>
    M.flatMap_(parseConsumedF(S, M)(p, s), cons =>
      M.map_(cons.value, result => result.toEither),
    );

export const parseConsumedF =
  <S, M>(S: Stream<S, M>, M: Monad<M>) =>
  <A>(
    p: ParserT<S, M, A>,
    s: S,
  ): Kind<M, [Consumed<Kind<M, [ParseResult<S, A>]>>]> =>
    parseLoopImpl(
      S,
      M,
      new State(s, new SourcePosition(0, 0)),
      p,
      new Cont(
        /*cok: */ flow(M.pure, Consumed.Consumed, M.pure),
        /*cerr: */ flow(M.pure, Consumed.Consumed, M.pure),
        /*eok: */ flow(M.pure, Consumed.Empty, M.pure),
        /*eerr: */ flow(M.pure, Consumed.Empty, M.pure),
      ),
    );

// -- Private implementation of the parsing of the input stream

interface ParseCtx<S, M, X, End> {
  readonly S: Stream<S, M>;
  readonly M: Monad<M>;
  readonly s: State<S>;
  readonly cont: Cont<S, M, X, End>;
  readonly go: <Z, End2>(
    s: State<S>,
    parser: ParserT<S, M, Z>,
    cont: Cont<S, M, Z, End2>,
  ) => Kind<M, [End2]>;
}

function parseLoopImpl<S, M, X, End>(
  S: Stream<S, M>,
  M: Monad<M>,
  s: State<S>,
  parser: ParserT<S, M, X>,
  cont0: Cont<S, M, X, End>,
): Kind<M, [End]> {
  const go = <Y>(
    s: State<S>,
    p0: ParserT<S, M, Y>,
    c0: Cont<S, M, Y, End>,
  ): Kind<M, [End]> => M.flatMap_(M.unit, () => parseLoopImpl(S, M, s, p0, c0));
  let cur_: ParserT<S, M, any> = parser;
  let cont_: Cont<S, M, any, End> = cont0;

  while (true) {
    const cur = cur_ as View<S, M, unknown>;
    const cont = cont_;

    switch (cur.tag) {
      case 'succeed':
        return cont.eok(
          new Success(cur.value, s, ParseError.empty(s.position)),
        );

      case 'fail':
        return cont.eerr(new Failure(new ParseError(s.position, [cur.msg])));

      case 'empty':
        return cont.eerr(new Failure(new ParseError(s.position, [])));

      case 'defer':
        cur_ = cur.thunk();
        break;

      case 'uncons-prim': {
        const ctx: ParseCtx<S, M, unknown, End> = { S, M, s, cont, go };
        return tokenPrimParse(ctx, cur.showToken, cur.nextPos, cur.test);
      }

      case 'make-parser-t':
        return pipe(
          M.unit,
          M.flatMap(() => cur.runParserT(M)(s)),
          M.flatMap(cons =>
            cons.tag === 'consumed'
              ? M.flatMap_(cons.value, r => r.fold(cont.cok, cont.cerr))
              : M.flatMap_(cons.value, r => r.fold(cont.eok, cont.eerr)),
          ),
        );

      case 'map':
        cur_ = cur.self;
        cont_ = new Cont(
          cont.cokContramap(suc => suc.map(cur.fun)),
          cont.cerr,
          cont.eokContramap(suc => suc.map(cur.fun)),
          cont.eerr,
        );
        break;

      case 'flatMap': {
        const ctx: ParseCtx<S, M, unknown, End> = { S, M, s, cont, go };
        cur_ = cur.self;
        cont_ = flatMapCont(ctx, cur.fun);
        break;
      }

      case 'backtrack':
        cur_ = cur.self;
        cont_ = cont.copy({ cerr: cont.eerr });
        break;

      case 'or-else': {
        const ctx: ParseCtx<S, M, unknown, End> = { S, M, s, cont, go };
        cur_ = cur.lhs;
        cont_ = orElseCont(ctx, cur.rhs);
        break;
      }
    }
  }
}

class Cont<S, M, X, End> {
  // prettier-ignore
  public constructor(
    public readonly cok : (suc: Success<S, X>) => Kind<M, [End]>,
    public readonly cerr: (fail: Failure  ) => Kind<M, [End]>,
    public readonly eok : (suc: Success<S, X>) => Kind<M, [End]>,
    public readonly eerr: (fail: Failure  ) => Kind<M, [End]>,
  ) {}

  public copy({
    cok = this.cok,
    cerr = this.cerr,
    eok = this.eok,
    eerr = this.eerr,
  }: Partial<Props<S, M, X, End>> = {}): Cont<S, M, X, End> {
    return new Cont(cok, cerr, eok, eerr);
  }

  public cokContramap<Y>(f: (suc: Success<S, Y>) => Success<S, X>) {
    return AndThen(this.cok).compose(f);
  }
  public eokContramap<Y>(f: (suc: Success<S, Y>) => Success<S, X>) {
    return AndThen(this.eok).compose(f);
  }

  public cokMergeError(error: ParseError) {
    return AndThen(this.cok).compose((suc: Success<S, X>) =>
      suc.mergeError(error),
    );
  }

  public cerrMergeError(error: ParseError) {
    return AndThen(this.cerr).compose((suc: Failure) => suc.mergeError(error));
  }

  public eokMergeError(error: ParseError) {
    return AndThen(this.eok).compose((suc: Success<S, X>) =>
      suc.mergeError(error),
    );
  }

  public eerrMergeError(error: ParseError) {
    return AndThen(this.eerr).compose((suc: Failure) => suc.mergeError(error));
  }
}

// prettier-ignore
type Props<S, M, X, End> = {
    readonly cok : (suc: Success<S, X>) => Kind<M, [End]>
    readonly cerr: (fail: Failure  ) => Kind<M, [End]>
    readonly eok : (suc: Success<S, X>) => Kind<M, [End]>
    readonly eerr: (fail: Failure  ) => Kind<M, [End]>
  };

function tokenPrimParse<S, M, X, End>(
  { S, M, s, cont }: ParseCtx<S, M, X, End>,
  showToken: (t: TokenType<S>) => string,
  nextPos: (sp: SourcePosition, t: TokenType<S>, s: S) => SourcePosition,
  test: (t: TokenType<S>) => Option<X>,
): Kind<M, [End]> {
  return M.flatMap_(S.uncons(s.input), opt =>
    opt.fold(
      () =>
        cont.eerr(new Failure(new ParseError(s.position, ['Empty uncons']))),
      ([tok, tl]) =>
        test(tok).fold(
          () =>
            cont.cerr(
              new Failure(
                new ParseError(s.position, [
                  `Unexpected token '${showToken(tok)}'`,
                ]),
              ),
            ),
          x =>
            cont.cok(
              new Success(
                x,
                new State(tl, nextPos(s.position, tok, tl)),
                ParseError.empty(s.position),
              ),
            ),
        ),
    ),
  );
}

function flatMapCont<S, M, Y, X, End>(
  { go, cont }: ParseCtx<S, M, X, End>,
  fun: (y: Y) => ParserT<S, M, X>,
): Cont<S, M, Y, End> {
  const mcok = (suc: Success<S, Y>): Kind<M, [End]> =>
    suc.error.isEmpty
      ? go(suc.remainder, fun(suc.output), cont)
      : go(
          suc.remainder,
          fun(suc.output),
          cont.copy({
            eok: cont.cokMergeError(suc.error),
            eerr: cont.cerrMergeError(suc.error),
          }),
        );

  const mcerr = cont.cerr;

  const meok = (suc: Success<S, Y>): Kind<M, [End]> =>
    suc.error.isEmpty
      ? go(suc.remainder, fun(suc.output), cont)
      : go(
          suc.remainder,
          fun(suc.output),
          cont.copy({
            eok: cont.eokMergeError(suc.error),
            eerr: cont.eerrMergeError(suc.error),
          }),
        );
  const meerr = cont.eerr;

  return new Cont(mcok, mcerr, meok, meerr);
}

function orElseCont<S, M, X, End>(
  { go, s, cont }: ParseCtx<S, M, X, End>,
  r: Lazy<ParserT<S, M, X>>,
): Cont<S, M, X, End> {
  const meerr = (fail: Failure) =>
    go(
      s,
      r(),
      cont.copy({
        eok: cont.eokMergeError(fail.error),
        eerr: cont.eerrMergeError(fail.error),
      }),
    );

  return cont.copy({ eerr: meerr });
}