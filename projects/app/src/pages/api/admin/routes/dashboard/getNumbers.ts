import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await adminCert({ req, authToken: true });
    const usersCount = await MongoUser.countDocuments();
    const datasetsCount = await MongoDataset.countDocuments();
    const appsCount = await MongoApp.countDocuments();

    jsonRes(res, {
      data: {
        usersCount,
        datasetsCount,
        appsCount
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
