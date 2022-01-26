// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import { id, pipe, tupled } from '@fp4ts/core';
import { Either, EitherT, Kleisli, List } from '@fp4ts/cats';
import {
  Accept,
  NotAcceptFailure,
  EntityEncoder,
  HttpApp,
  HttpRoutes,
  MessageFailure,
  ParsingFailure,
  Response,
  Status,
  Method,
  EntityBody,
  UnsupportedMediaTypeFailure,
  Request,
  MethodNotAllowedFailure,
  SelectHeader,
  RawHeader,
  Headers,
} from '@fp4ts/http-core';
import {
  Alt,
  Sub,
  VerbNoContentElement,
  CaptureElement,
  QueryElement,
  StaticElement,
  VerbElement,
  Type,
  ReqBodyElement,
  ContentTypeWithMime,
  FromHttpApiDataTag,
  ToHttpApiDataTag,
  HeaderElement,
  RawHeaderElement,
  HeadersElement,
  HeadersVerbElement,
} from '@fp4ts/http-dsl-shared';
import { Concurrent, IO, IoK } from '@fp4ts/effect';

import { Context, EmptyContext } from './context';
import { Delayed } from './delayed';
import { DelayedCheck } from './delayed-check';
import {
  CaptureRouter,
  choice,
  leafRouter,
  pathRouter,
  Router,
  runRouterEnv,
} from './router';
import { Server, DeriveCoding, OmitBuiltins } from '../type-level';
import { builtins } from '../builtin-codables';
import { RouteResult, RouteResultT } from './route-result';
import { RoutingApplication } from './routing-application';
import { ServerM } from '../server-m';
import { AddHeader } from '../add-header';
import { Handler } from './handler';
import { Codable } from '../codable';

export const toHttpAppIO =
  <api>(api: api, codings: OmitBuiltins<DeriveCoding<IoK, api>>) =>
  (makeServer: (f: ServerM<IoK>) => Server<IoK, api>): HttpApp<IoK> =>
    toHttpApp(IO.Async)(api, codings)(makeServer);

export const toHttpApp =
  <F>(F: Concurrent<F, Error>) =>
  <api>(api: api, codings: OmitBuiltins<DeriveCoding<F, api>>) =>
  (makeServer: (f: ServerM<F>) => Server<F, api>): HttpApp<F> =>
    HttpRoutes.orNotFound(F)(toHttpRoutes(F)(api, codings)(makeServer));

export const toHttpRoutes =
  <F>(F: Concurrent<F, Error>) =>
  <api>(api: api, codings: OmitBuiltins<DeriveCoding<F, api>>) =>
  (makeServer: (f: ServerM<F>) => Server<F, api>): HttpRoutes<F> => {
    const r = runRouterEnv(F)(
      route(F)(
        api,
        EmptyContext,
        Delayed.empty(F)(RouteResult.succeed(makeServer(new ServerM(F)))),
        merge(builtins, codings),
      ),
      undefined as void,
    );
    return Kleisli(req => r.run(req).respond(F));
  };

const merge = (xs: any, ys: any): any => {
  const zs = {} as Record<string, any>;
  for (const k in xs) {
    zs[k] = { ...zs[k], ...xs[k], ...ys[k] };
  }
  for (const k in ys) {
    zs[k] = { ...zs[k], ...xs[k], ...ys[k] };
  }
  return zs;
};

export function route<F>(F: Concurrent<F, Error>) {
  const EF = RouteResultT.Monad(F);
  function route<api, context extends unknown[], env>(
    api: api,
    ctx: Context<context>,
    server: Delayed<F, env, Server<F, api>>,
    codings: DeriveCoding<F, api>,
  ): Router<env, RoutingApplication<F>> {
    if (api instanceof Alt) {
      return routeAlt(api, ctx, server, codings);
    }

    if (api instanceof Sub) {
      const { lhs, rhs } = api;
      if (lhs instanceof CaptureElement) {
        return routeCapture(lhs, rhs, ctx, server as any, codings as any);
      }
      if (lhs instanceof QueryElement) {
        return routeQuery(lhs, rhs, ctx, server as any, codings as any);
      }
      if (lhs instanceof StaticElement) {
        return routeStatic(lhs, rhs, ctx, server, codings);
      }
      if (lhs instanceof HeaderElement) {
        return routeHeader(lhs, rhs, ctx, server as any, codings as any);
      }
      if (lhs instanceof RawHeaderElement) {
        return routeRawHeader(lhs, rhs, ctx, server as any, codings as any);
      }
      if (lhs instanceof ReqBodyElement) {
        return routeReqBody(lhs, rhs, ctx, server as any, codings);
      }
      throw new Error('Invalid sub');
    }

    if (api instanceof VerbElement) {
      return routeVerbContent(api, ctx, server as any, codings);
    }

    if (api instanceof HeadersVerbElement) {
      return routeHeadersVerbContent(api, ctx, server as any, codings as any);
    }

    if (api instanceof VerbNoContentElement) {
      return routeVerbNoContent(api, ctx, server as any, codings);
    }

    throw new Error('Invalid API');
  }

  function routeAlt<
    xs extends [unknown, ...unknown[]],
    context extends unknown[],
    env,
  >(
    api: Alt<xs>,
    ctx: Context<context>,
    server: Delayed<F, env, Server<F, Alt<xs>>>,
    codings: DeriveCoding<F, Alt<xs>>,
  ): Router<env, RoutingApplication<F>> {
    return choice(
      ...api.xs.map((x: any, i: number) =>
        route(
          x,
          ctx,
          server.map(EF)(xs => xs[i]),
          codings,
        ),
      ),
    );
  }

  function routeCapture<api, context extends unknown[], env, A>(
    a: CaptureElement<any, Type<any, A>>,
    api: api,
    ctx: Context<context>,
    d: Delayed<F, env, Server<F, Sub<CaptureElement<any, Type<any, A>>, api>>>,
    codings: DeriveCoding<F, Sub<CaptureElement<any, Type<any, A>>, api>>,
  ): Router<env, RoutingApplication<F>> {
    const { fromPathComponent } = codings[FromHttpApiDataTag][a.type.ref];
    return new CaptureRouter(
      route(
        api,
        ctx,
        d.addCapture(EF)(txt =>
          DelayedCheck.withRequest(F)(() =>
            pipe(
              fromPathComponent(txt),
              RouteResult.fromEither,
              RouteResultT.lift(F),
            ),
          ),
        ),
        codings,
      ),
    );
  }

  function routeQuery<api, context extends unknown[], env, A>(
    a: QueryElement<any, Type<any, A>>,
    api: api,
    ctx: Context<context>,
    d: Delayed<F, env, Server<F, Sub<QueryElement<any, Type<any, A>>, api>>>,
    codings: DeriveCoding<F, Sub<CaptureElement<any, Type<any, A>>, api>>,
  ): Router<env, RoutingApplication<F>> {
    const { fromQueryParameter } = codings[FromHttpApiDataTag][a.type.ref];
    return route(
      api,
      ctx,
      d.addParamCheck(EF)(
        DelayedCheck.withRequest(F)(req => {
          const value = req.uri.query.lookup(a.property);
          const result = value
            .map(v =>
              v.traverse(Either.Applicative<MessageFailure>())(
                fromQueryParameter,
              ),
            )
            .toRight(() => new ParsingFailure('Missing query'))
            .flatMap(id);
          return pipe(RouteResult.fromEither(result), RouteResultT.lift(F));
        }),
      ),
      codings,
    );
  }

  function routeHeader<api, context extends unknown[], env, G, A>(
    a: HeaderElement<SelectHeader<G, A>>,
    api: api,
    ctx: Context<context>,
    d: Delayed<F, env, Server<F, Sub<HeaderElement<SelectHeader<G, A>>, api>>>,
    codings: DeriveCoding<F, Sub<HeaderElement<SelectHeader<G, A>>, api>>,
  ): Router<env, RoutingApplication<F>> {
    const S = a.header;
    const headerCheck = DelayedCheck.withRequest(F)(req =>
      req.headers
        .get(S)
        .fold(
          () =>
            RouteResultT.fatalFail(F)(
              new ParsingFailure(`Expected header ${S.header.headerName}`),
            ),
          RouteResultT.succeed(F),
        ),
    );

    return route(api, ctx, d.addHeaderCheck(EF)(headerCheck), codings);
  }

  function routeRawHeader<
    api,
    context extends unknown[],
    env,
    H extends string,
    A,
  >(
    a: RawHeaderElement<H, Type<any, A>>,
    api: api,
    ctx: Context<context>,
    d: Delayed<F, env, Server<F, Sub<RawHeaderElement<H, Type<any, A>>, api>>>,
    codings: DeriveCoding<F, Sub<RawHeaderElement<H, Type<any, A>>, api>>,
  ): Router<env, RoutingApplication<F>> {
    const { parseHeader } = codings[FromHttpApiDataTag][a.type.ref];
    const headerCheck = DelayedCheck.withRequest(F)(req =>
      pipe(
        req.headers
          .getRaw(a.key)
          .flatMap(xs => xs.headOption)
          .toRight(() => new ParsingFailure(`Expected header ${a.key}`))
          .flatMap(parseHeader),
        RouteResult.fromEitherFatal,
        RouteResultT.lift(F),
      ),
    );

    return route(api, ctx, d.addHeaderCheck(EF)(headerCheck), codings);
  }

  function routeReqBody<
    api,
    context extends unknown[],
    env,
    A,
    M extends string,
    CT extends ContentTypeWithMime<M>,
  >(
    body: ReqBodyElement<CT, Type<any, A>>,
    api: api,
    ctx: Context<context>,
    d: Delayed<F, env, Server<F, Sub<ReqBodyElement<CT, Type<any, A>>, api>>>,
    codings: DeriveCoding<F, Sub<ReqBodyElement<CT, Type<any, A>>, api>>,
  ): Router<env, RoutingApplication<F>> {
    const { decode } = codings[body.ct.mime][body.body.ref];
    const ctCheck = DelayedCheck.withRequest(F)(req =>
      req.contentType.fold(
        () => RouteResultT.succeed(F)(req.bodyText),
        ct =>
          ct.mediaType.satisfies(body.ct.self.mediaType)
            ? RouteResultT.succeed(F)(req.bodyText)
            : RouteResultT.fail(F)(
                new UnsupportedMediaTypeFailure(body.ct.self.mediaType),
              ),
      ),
    );

    return route(
      api,
      ctx,
      d.addBodyCheck(EF)(ctCheck, s =>
        Kleisli(() =>
          RouteResultT.fromEitherFatal(F)(
            // Fatal fail ^ as we cannot consume body more than once
            pipe(s.compileConcurrent(F).string, F.attempt, EitherT)
              .leftMap(F)(e => new ParsingFailure(e.message) as MessageFailure)
              .flatMap(F)(str => EitherT(F.pure(decode(str)))),
          ),
        ),
      ),
      codings,
    );
  }

  function routeStatic<api, context extends unknown[], env>(
    path: StaticElement<any>,
    api: api,
    ctx: Context<context>,
    d: Delayed<F, env, Server<F, Sub<StaticElement<any>, api>>>,
    codings: DeriveCoding<F, Sub<StaticElement<any>, api>>,
  ): Router<env, RoutingApplication<F>> {
    return pathRouter(path.path, route(api, ctx, d, codings));
  }

  function routeVerbContent<
    context extends unknown[],
    env,
    M extends string,
    CT extends ContentTypeWithMime<M>,
    A,
  >(
    verb: VerbElement<any, CT, Type<any, A>>,
    ctx: Context<context>,
    d: Delayed<F, env, Server<F, VerbElement<any, CT, Type<any, A>>>>,
    codings: DeriveCoding<F, VerbElement<any, CT, Type<any, A>>>,
  ): Router<env, RoutingApplication<F>> {
    return routeMethod(
      verb.method,
      verb.status,
      [],
      verb.body,
      verb.contentType,
      ctx,
      d,
      codings,
    );
  }

  function routeHeadersVerbContent<
    context extends unknown[],
    env,
    M extends string,
    CT extends ContentTypeWithMime<M>,
    A,
    H extends HeadersElement<any, Type<any, A>>,
  >(
    verb: HeadersVerbElement<any, CT, H>,
    ctx: Context<context>,
    d: Delayed<F, env, Server<F, HeadersVerbElement<any, CT, H>>>,
    codings: DeriveCoding<F, HeadersVerbElement<any, CT, H>>,
  ): Router<env, RoutingApplication<F>> {
    return routeMethod(
      verb.method,
      verb.status,
      verb.headers.headers,
      verb.headers.body,
      verb.contentType,
      ctx,
      d,
      codings,
    );
  }

  function routeVerbNoContent<context extends unknown[], env>(
    verb: VerbNoContentElement<any>,
    ctx: Context<context>,
    d: Delayed<F, env, Server<F, VerbNoContentElement<any>>>,
    codings: DeriveCoding<F, VerbNoContentElement<any>>,
  ): Router<env, RoutingApplication<F>> {
    return leafRouter(env =>
      Kleisli(req =>
        d
          .addMethodCheck(EF)(methodCheck(verb.method))
          .runDelayed(EF)(env, req)
          .flatMap(F)(RouteResultT.fromEither(F))
          .map(F)(() =>
          new Response<F>(Status.NoContent).withHttpVersion(req.httpVersion),
        ),
      ),
    );
  }

  function routeMethod<
    context extends unknown[],
    env,
    M extends string,
    CT extends ContentTypeWithMime<M>,
    A,
    R extends string,
  >(
    method: Method,
    status: Status,
    headers: (HeaderElement<any> | RawHeaderElement<any, Type<any, any>>)[],
    body: Type<R, A>,
    ct: CT,
    ctx: Context<context>,
    d: Delayed<F, env, Handler<F, A>>,
    codings: { [_ in CT['mime']]: { [_ in R]: Codable<A> } },
  ): Router<env, RoutingApplication<F>> {
    const { encode } = codings[ct.mime][body.ref];
    const acceptCheck = DelayedCheck.withRequest(F)(req =>
      pipe(
        req.headers
          .get(Accept.Select)
          .map(ah =>
            ah.mediaRanges.any(mr => mr.satisfiedBy(ct.self.mediaType))
              ? RouteResult.succeedUnit
              : RouteResult.fail(new NotAcceptFailure(ct.self, ah)),
          )
          .fold(() => RouteResult.succeedUnit, id),
        RouteResultT.lift(F),
      ),
    );

    const getHeadersEncoder = (
      hs: (HeaderElement<any> | RawHeaderElement<any, Type<any, any>>)[],
      a: AddHeader<any, any> | any,
    ) => {
      let acc: List<RawHeader> = List.empty;
      for (let i = 0, l = hs.length; i < l; i++) {
        const h = hs[i];
        if (h instanceof HeaderElement) {
          const raw = h.header.toRaw(a.header);
          acc = acc['+++'](raw);
          a = a.body;
        } else if (h instanceof RawHeaderElement) {
          const { toHeader } = (codings as any)[ToHttpApiDataTag][h.type.ref];
          const raw = new RawHeader(h.key, toHeader(a.header));
          acc = acc.prepend(raw);
          a = a.body;
        } else {
          throw new Error('Invalid Headers element');
        }
      }

      return tupled(new Headers(acc), a);
    };

    return leafRouter(env =>
      Kleisli(req =>
        d
          .addAcceptCheck(EF)(acceptCheck)
          .addMethodCheck(EF)(methodCheck(method))
          .runDelayed(EF)(env, req)
          .flatMap(F)(RouteResultT.fromEitherFatal(F))
          .map(F)(a => {
          const [hs, e] = getHeadersEncoder(headers, a);
          const res = new Response<F>(status, req.httpVersion)
            .withEntity(encode(e), EntityEncoder.text())
            .putHeaders(ct.self)
            .putHeaders(hs);
          return req.method === Method.HEAD
            ? res.withEntityBody(EntityBody.empty())
            : res;
        }),
      ),
    );
  }

  const requestMethod = (m: Method, req: Request<F>): boolean =>
    m.methodName === req.method.methodName;

  const allowedMethodMead = (m: Method, req: Request<F>): boolean =>
    m.methodName === 'GET' && req.method.methodName === 'HEAD';

  const methodAllowed = (m: Method, req: Request<F>): boolean =>
    allowedMethodMead(m, req) || requestMethod(m, req);

  const methodCheck = (m: Method): DelayedCheck<F, void> =>
    DelayedCheck.withRequest(F)(req =>
      methodAllowed(m, req)
        ? RouteResultT.succeedUnit(F)
        : RouteResultT.fail(F)(new MethodNotAllowedFailure(m)),
    );

  return route;
}
