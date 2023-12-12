import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/service/mongo';
import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';

export default async function getConfig(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });
    const latestConfigs = await MongoSystemConfigs.aggregate([
      {
        $sort: { createTime: -1 }
      },
      {
        $group: {
          _id: '$type',
          latestConfig: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestConfig' }
      }
    ]);

    jsonRes(res, {
      data: {
        latestConfigs
      }
    });
  } catch (err) {
    console.error(`Error in getConfig: ${err}`);
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
