// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoUserInform } from '@/service/support/user/inform/schema';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { InformLevelEnum } from '@fastgpt/global/support/user/inform/constants';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    if (!req.headers.cookie) {
      return jsonRes(res, {
        data: 0
      });
    }
    const { userId } = await authCert({ req, authToken: true });

    const [unReadCount, importantInforms] = await Promise.all([
      MongoUserInform.countDocuments(
        {
          userId,
          read: false
        },
        {
          ...readFromSecondary
        }
      ),
      MongoUserInform.find(
        {
          userId,
          read: false,
          level: { $ne: InformLevelEnum.common }
        },
        {
          ...readFromSecondary
        }
      )
        .limit(2)
        .sort({ time: -1 })
    ]);

    jsonRes(res, {
      data: {
        unReadCount,
        importantInforms
      }
    });
  } catch (err) {
    jsonRes(res, {
      data: 0
    });
  }
}
