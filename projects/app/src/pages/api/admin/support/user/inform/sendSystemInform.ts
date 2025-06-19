import { sendInform2AllUser } from '@/service/support/user/inform/controller';
import { adminCert } from '@/service/support/permission/adminCert';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { InformLevelEnum } from '@fastgpt/global/support/user/inform/constants';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';

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
  const { tmbId, teamId } = await adminCert({ req, authToken: true });

  const { title, content, level } = req.body;
  await sendInform2AllUser({
    title,
    content,
    level
  });

  addAuditLog({
    tmbId,
    teamId,
    event: AdminAuditEventEnum.ADMIN_SEND_SYSTEM_INFORM,
    params: {
      informTitle: title,
      level: level
    }
  });

  return {};
}

export default NextAPI(handler);
