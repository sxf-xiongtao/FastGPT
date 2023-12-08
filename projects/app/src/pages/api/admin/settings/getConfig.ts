import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/service/mongo';
import { MongoConfigs } from '@fastgpt/service/common/system/configSchema';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';

export default async function getConfig(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });
    const config = await MongoConfigs.findOne({}).sort({ createTime: -1 });
    jsonRes(res, {
      data: {
        config
      }
    });
  } catch (err) {
    console.error(`Error in getConfig: ${err}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
