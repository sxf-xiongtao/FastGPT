import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { FastGPTConfigFileType } from '@fastgpt/global/common/system/types';
import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { SystemConfigType } from '@/types';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';

export const updateSystemConfig = ({
  fastgpt,
  fastgptPro
}: {
  fastgpt: FastGPTConfigFileType;
  fastgptPro: SystemConfigType;
}) => {
  return mongoSessionRun(async (session) => {
    await MongoSystemConfigs.create(
      [
        {
          type: SystemConfigsTypeEnum.fastgpt,
          value: fastgpt
        }
      ],
      {
        session,
        ordered: true
      }
    );
    await MongoSystemConfigs.create(
      [
        {
          type: SystemConfigsTypeEnum.fastgptPro,
          value: fastgptPro
        }
      ],
      {
        session,
        ordered: true
      }
    );
  });
};

export const getSystemConfig = async () => {
  const [fastgptConfig, fastgptProConfig] = await Promise.all([
    MongoSystemConfigs.findOne({
      type: SystemConfigsTypeEnum.fastgpt
    }).sort({
      createTime: -1
    }),
    MongoSystemConfigs.findOne({
      type: SystemConfigsTypeEnum.fastgptPro
    }).sort({
      createTime: -1
    })
  ]);

  const systemConfig: SystemConfigType = fastgptProConfig?.value
    ? (fastgptProConfig?.value as SystemConfigType)
    : {};
  const fastgptConfigValue = fastgptConfig?.value as FastGPTConfigFileType | undefined;

  return {
    fastgptConfig: fastgptConfigValue,
    fastgptProConfig: systemConfig
  };
};
