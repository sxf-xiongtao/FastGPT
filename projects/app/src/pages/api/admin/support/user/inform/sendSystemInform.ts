import { sendInform2AllUser } from '@/service/support/user/inform/controller';
import { adminCert } from '@/service/support/permission/adminCert';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { InformLevelEnum } from '@fastgpt/global/support/user/inform/constants';

export type SendSystemInformQuery = {};
export type SendSystemInformBody = {
  title: string;
  content: string;
  level: `${InformLevelEnum}`;
};
export type SendSystemInformResponse = {};

async function handler(
  req: ApiRequestProps<SendSystemInformBody, SendSystemInformQuery>,
  _res: ApiResponseType<any>
): Promise<SendSystemInformResponse> {
  await adminCert({ req, authToken: true });

  const { title, content, level } = req.body;
  await sendInform2AllUser({
    title,
    content,
    level
  });

  return {};
}

export default NextAPI(handler);
