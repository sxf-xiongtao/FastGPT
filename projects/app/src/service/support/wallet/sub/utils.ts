import {
  SubModeEnum,
  SubStatusEnum,
  SubTypeEnum
} from '@fastgpt/global/support/wallet/sub/constants';
import { TeamSubSchema } from '@fastgpt/global/support/wallet/sub/type';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';

export const updateTeamExtraDatasetSizeSub = async ({
  sub,
  teamId,
  startTime,
  expiredTime,
  price,
  currentExtraDatasetSize,
  nextExtraDatasetSize
}: {
  sub?: TeamSubSchema | null;
  teamId: string;
  startTime: Date;
  expiredTime: Date;
  price: number;
  currentExtraDatasetSize: number;
  nextExtraDatasetSize: number;
}) => {
  if (sub) {
    await MongoTeamSub.findByIdAndUpdate(sub._id, {
      startTime,
      expiredTime,
      currentExtraDatasetSize,
      nextExtraDatasetSize,
      price
    });
  } else {
    // 创建新的订阅
    await MongoTeamSub.create({
      teamId,
      type: SubTypeEnum.extraDatasetSize,
      status: SubStatusEnum.active,
      mode: SubModeEnum.month,
      startTime: startTime,
      expiredTime: expiredTime,
      price: price,

      currentExtraDatasetSize: currentExtraDatasetSize,
      nextExtraDatasetSize: nextExtraDatasetSize
    });
  }
};
