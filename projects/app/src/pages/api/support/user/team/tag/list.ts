/**
 * 获取团队标签数据
 * @param{string} teamId
 */
import type { NextApiRequest, NextApiResponse } from 'next';

import { jsonRes } from '@fastgpt/service/common/response';
import { getTeamTags } from '@/service/support/user/team/tagController';
import { authCert } from '@fastgpt/service/support/permission/auth/common';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId } = await authCert({ req, authToken: true });

    jsonRes(res, {
      data: await getTeamTags(teamId)
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
