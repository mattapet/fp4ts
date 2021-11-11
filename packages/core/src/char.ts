import { Byte } from './byte';

declare const charTag: unique symbol;
/** A single character string */
export type Char = string & { tag: typeof charTag };

export const Char = Object.freeze({
  toByte: (c: Char) => c.charCodeAt(0) as Byte,
  toString: (c: Char) => c as string,

  fromByte: (x: Byte) => String.fromCharCode(x) as Char,
  fromString: (s: string) => (s === '' ? undefined : (s[0] as Char)),
  unsafeFromString: (s: string) => s as Char,
});