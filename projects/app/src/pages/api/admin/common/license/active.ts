import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { authLicense } from '@/service/common/license/auth';
import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { jsonRes } from '@fastgpt/service/common/response';
import { getErrText } from '@fastgpt/global/common/error/utils';

export type activeQuery = {};

export type activeBody = {
  license: string;
};

export type activeResponse = any;

async function handler(
  req: ApiRequestProps<activeBody, activeQuery>,
  res: ApiResponseType<any>
): Promise<activeResponse> {
  try {
    const { license } = req.body;

    const data = await authLicense(license);

    // 写入数据库
    await MongoSystemConfigs.updateOne(
      { type: SystemConfigsTypeEnum.license },
      {
        $set: {
          createTime: new Date(),
          type: SystemConfigsTypeEnum.license,
          value: { license, data }
        }
      },
      { upsert: true }
    );

    global.licenseData = data;

    jsonRes(res);
  } catch (error) {
    return jsonRes(res, {
      code: 500,
      error: getErrText(error)
    });
  }
}

export default handler;
