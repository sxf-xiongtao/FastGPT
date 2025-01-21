// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoUserInform } from '@/service/support/user/inform/schema';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import { NextAPI } from '@/service/middleware/entry';
import { PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { UserInformSchema } from '@fastgpt/global/support/user/inform/type';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<PaginationResponse<UserInformSchema>> {
  const { userId } = await authCert({ req, authToken: true });

  const { pageNum, pageSize = 20 } = req.body as {
    pageNum: number;
    pageSize: number;
  };

  const [informs, total] = await Promise.all([
    MongoUserInform.find({ userId }, undefined, { ...readFromSecondary })
      .sort({ read: 1, time: -1 }) // 按照创建时间倒序排列
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize),
    MongoUserInform.countDocuments({ userId }, { ...readFromSecondary })
  ]);

  return {
    list: informs,
    total
  };
}

export default NextAPI(handler);
