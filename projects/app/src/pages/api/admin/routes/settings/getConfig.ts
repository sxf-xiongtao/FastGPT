import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';

export type GetConfigQuery = {};
export type GetConfigBody = {};
export type GetConfigResponse = {};

async function handler(
  req: ApiRequestProps<GetConfigBody, GetConfigQuery>,
  res: ApiResponseType<any>
): Promise<GetConfigResponse> {
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
  return {
    [SystemConfigsTypeEnum.fastgpt]: fastgptConfig?.value,
    [SystemConfigsTypeEnum.fastgptPro]: formatFastgptProConfig
      ? {
          ...formatFastgptProConfig,
          license: undefined
        }
      : undefined
  };
}
export default NextAPI(handler);
