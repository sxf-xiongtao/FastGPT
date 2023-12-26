import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/service/mongo';
import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';

export default async function getConfig(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });
    let [fastgptConfig, fastgptProConfig] = await Promise.all([
      MongoSystemConfigs.findOne({
        type: SystemConfigsTypeEnum.fastgpt
      })
        .sort({
          createTime: -1
        })
        .lean(),
      MongoSystemConfigs.findOne({
        type: SystemConfigsTypeEnum.fastgptPro
      })
        .sort({
          createTime: -1
        })
        .lean()
    ]);

    const formatFastgptProConfig = fastgptProConfig?.value || global.systemConfig;

    jsonRes(res, {
      data: {
        [SystemConfigsTypeEnum.fastgpt]: fastgptConfig?.value,
        [SystemConfigsTypeEnum.fastgptPro]: formatFastgptProConfig
          ? {
              ...formatFastgptProConfig,
              license: undefined
            }
          : undefined
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
