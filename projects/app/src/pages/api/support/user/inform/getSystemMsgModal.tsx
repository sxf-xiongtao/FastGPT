import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();

    jsonRes(res, {
      data: (
        await MongoSystemConfigs.findOne({
          type: SystemConfigsTypeEnum.systemMsgModal
        })
      )?.value
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
