import { Codable } from '@fp4ts/http-dsl-server';
import { typeDef } from '@fp4ts/http-dsl-shared';
import { Schema, TypeOf } from '@fp4ts/schema';

export const Animal = Schema.struct({
  spieces: Schema.string,
  legs: Schema.number,
});

export type Animal = TypeOf<typeof Animal>;

export const AnimalTypeTag = '@fp4ts/http/__tests__/animal';
export type AnimalTypeTag = typeof AnimalTypeTag;
export const AnimalType = typeDef(AnimalTypeTag, Animal);

export const AnimalCodable: Codable<Animal> = Codable.json.fromSchema(Animal);
