import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/service/mongo';
import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';

export default async function updateConfig(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    if (req.body.fastgpt) {
      await MongoSystemConfigs.create({
        type: 'fastgpt',
        value: req.body.fastgpt
      });
    }
    if (req.body.fastgptPro) {
      await MongoSystemConfigs.create({
        type: 'fastgptPro',
        value: req.body.fastgptPro
      });
    }
    jsonRes(res, {
      data: 'success'
    });
  } catch (err) {
    console.error(`Error in updateConfig: ${err}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
