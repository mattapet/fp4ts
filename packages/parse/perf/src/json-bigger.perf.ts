// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fs from 'fs';
import { jsonP } from './json';

const timed = (msg: string, f: () => void): void => {
  const start = Date.now();
  f();
  const end = Date.now();
  console.log(`${msg}: ${end - start}ms`);
};

{
  const file = fs.readFileSync('./src/resources/bla25.json');
  const contents = file.toString();
  timed('@fp4ts bla25', () => jsonP.parse(contents));
  timed('native bla25', () => JSON.parse(contents));
}

{
  const file = fs.readFileSync('./src/resources/ugh10k.json');
  const contents = file.toString();

  timed('@fp4ts ugh10k', () => jsonP.parse(contents));
  timed('native ugh10k', () => jsonP.parse(contents));
}
