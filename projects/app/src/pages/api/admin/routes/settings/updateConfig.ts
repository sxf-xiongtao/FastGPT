import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/service/mongo';
import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { ConfigStoreType } from '@/global/admin/config';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import axios from 'axios';

export default async function updateConfig(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const { fastgpt, fastgptPro } = req.body as ConfigStoreType;

    if (fastgpt) {
      await MongoSystemConfigs.create({
        type: SystemConfigsTypeEnum.fastgpt,
        value: fastgpt
      });
      // delete 30 day ago
      await MongoSystemConfigs.deleteMany({
        type: SystemConfigsTypeEnum.fastgpt,
        createTime: { $lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });
    }
    if (fastgptPro) {
      await MongoSystemConfigs.create({
        type: SystemConfigsTypeEnum.fastgptPro,
        value: fastgptPro
      });
      await MongoSystemConfigs.deleteMany({
        type: SystemConfigsTypeEnum.fastgptPro,
        createTime: { $lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });
    }

    // update env
    global.systemConfig = fastgptPro;
    // hook to update fastgpt domain
    if (fastgptPro.system.fastgpt_domain) {
      axios({
        method: 'GET',
        baseURL: fastgptPro.system.fastgpt_domain,
        url: '/api/common/system/refreshConfig',
        headers: {
          rootkey: process.env.ROOT_KEY
        }
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
