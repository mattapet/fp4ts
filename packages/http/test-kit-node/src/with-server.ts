// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import http from 'http';
import { IO, IoK } from '@fp4ts/effect';
import { HttpApp } from '@fp4ts/http-core';
import { serve } from '@fp4ts/http-node-server';

export const withServer =
  (app: HttpApp<IoK>, port: number = 3000) =>
  (run: (server: http.Server) => IO<void>): IO<void> =>
    serve(IO.Async)(app, port).use(IO.Async)(run);

export const withServerP =
  (app: HttpApp<IoK>, port: number = 3000) =>
  (run: (server: http.Server) => Promise<void>): IO<void> =>
    serve(IO.Async)(app, port).use(IO.Async)(server =>
      IO.deferPromise(() => run(server)),
    );