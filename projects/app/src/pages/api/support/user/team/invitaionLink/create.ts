import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';

export type InvitationLinkCreateQuery = {};
export type InvitationLinkCreateBody = {};
export type InvitationLinkCreateResponse = {};

async function handler(
  req: ApiRequestProps<InvitationLinkCreateBody, InvitationLinkCreateQuery>,
  res: ApiResponseType<any>
): Promise<InvitationLinkCreateResponse> {
  return {};
}
export default NextAPI(handler);
