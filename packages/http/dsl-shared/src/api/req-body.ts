import { Type } from '../type';
import { BaseElement } from './base-element';
import { ElementTag } from './api-element';
import { ContentTypeWithMime } from './content-types';

export const ReqBodyTag = '@fp4ts/http/dsl-shared/req-body';
export type ReqBodyTag = typeof ReqBodyTag;

export class ReqBodyElement<
  CT extends ContentTypeWithMime<any>,
  A extends Type<any, any>,
> extends BaseElement<ReqBodyTag> {
  [ElementTag]: ReqBodyTag;

  public constructor(public readonly ct: CT, public readonly body: A) {
    super();
  }
}

export const ReqBody = <
  CT extends ContentTypeWithMime<any>,
  A extends Type<any, any>,
>(
  ct: CT,
  body: A,
): ReqBodyElement<CT, A> => new ReqBodyElement(ct, body);
