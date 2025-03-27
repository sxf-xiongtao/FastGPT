// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { SendInformProps } from '@/service/support/user/inform/type';
import { InformLevelEnum } from '@fastgpt/global/support/user/inform/constants';
import { sendInform2OneUser } from '@/service/support/user/inform/controller';
import { NextAPI } from '@/service/middleware/entry';
import { SendInformTemplateCodeEnum } from '@fastgpt/global/support/user/inform/constants';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, teamId, level, templateCode, templateParam, customLockMinutes } =
    req.body as SendInformProps<InformLevelEnum, SendInformTemplateCodeEnum>;
  await authCert({ req, authRoot: true });

  // create one unactive inform
  return sendInform2OneUser({
    userId,
    teamId,
    level,
    templateCode,
    templateParam,
    customLockMinutes
  });
}

export default NextAPI(handler);
