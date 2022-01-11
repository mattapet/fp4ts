// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Schema, TypeOf } from '@fp4ts/schema';

export const Todo = Schema.struct({
  id: Schema.number,
  text: Schema.string,
  description: Schema.string.nullable,
  completed: Schema.boolean,
});
export type Todo = TypeOf<typeof Todo>;

export const CreateTodo = Schema.struct({
  text: Schema.string,
  description: Schema.string.nullable,
});
export type CreateTodo = TypeOf<typeof CreateTodo>;
