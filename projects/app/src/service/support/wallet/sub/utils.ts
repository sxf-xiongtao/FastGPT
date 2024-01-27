import { PRICE_SCALE } from '@fastgpt/global/support/wallet/bill/constants';
import {
  POINTS_SCALE,
  StandardSubLevelEnum,
  SubModeEnum,
  SubStatusEnum,
  SubTypeEnum
} from '@fastgpt/global/support/wallet/sub/constants';
import { TeamSubSchema } from '@fastgpt/global/support/wallet/sub/type';
import { ClientSession } from '@fastgpt/service/common/mongo';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { addMonths } from 'date-fns';

export const createTeamFreeSubPlan = ({
  teamId,
  session
}: {
  teamId: string;
  session?: ClientSession;
}) => {
  const freePoints = getFreeSubPlanPoints();
  const freePlanContent = getStandardPlan('free');

  return MongoTeamSub.create(
    [
      {
        teamId,
        type: SubTypeEnum.standard,
        status: SubStatusEnum.active,
        currentMode: SubModeEnum.month,
        nextMode: SubModeEnum.month,
        startTime: new Date(),
        expiredTime: addMonths(new Date(), 1),
        price: 0,

        currentSubLevel: StandardSubLevelEnum.free,
        nextSubLevel: StandardSubLevelEnum.free,
        pointPrice: 0,
        totalPoints: freePoints,

        surplusPoints: freePoints
      }
    ],
    { session }
  );
};

export const updateTeamExtraDatasetSizeSub = async ({
  sub,
  teamId,
  startTime,
  expiredTime,
  price,
  currentExtraDatasetSize,
  nextExtraDatasetSize,
  session
}: {
  sub?: TeamSubSchema | null;
  teamId: string;
  startTime: Date;
  expiredTime: Date;
  price: number;
  currentExtraDatasetSize: number;
  nextExtraDatasetSize: number;
  session: ClientSession;
}) => {
  if (sub) {
    await MongoTeamSub.findByIdAndUpdate(
      sub._id,
      {
        startTime,
        expiredTime,
        currentExtraDatasetSize,
        nextExtraDatasetSize,
        price
      },
      { session }
    );
  } else {
    // 创建新的订阅
    await MongoTeamSub.create(
      [
        {
          teamId,
          type: SubTypeEnum.extraDatasetSize,
          status: SubStatusEnum.active,
          currentMode: SubModeEnum.month,
          nextMode: SubModeEnum.month,
          startTime: startTime,
          expiredTime: expiredTime,
          price: price,

          currentExtraDatasetSize: currentExtraDatasetSize,
          nextExtraDatasetSize: nextExtraDatasetSize
        }
      ],
      { session }
    );
  }
};

export const getExtraDatasetSizePrice = (type?: 'read' | 'store') => {
  const scale = type === 'read' ? 1 : PRICE_SCALE;
  return (global.fatgptMainConfig?.subPlans?.extraDatasetSize?.price || 0) * scale;
};
export const getStandardPlan = (level: `${StandardSubLevelEnum}`) => {
  return global.fatgptMainConfig?.subPlans?.standard?.[level];
};
export const checkStandardPlanLarge = (
  oldLevel: `${StandardSubLevelEnum}`,
  newLevel: `${StandardSubLevelEnum}`
) => {
  const arr = [
    StandardSubLevelEnum.free,
    StandardSubLevelEnum.experience,
    StandardSubLevelEnum.team,
    StandardSubLevelEnum.enterprise
  ];
  const oldIndex = arr.findIndex((item) => item === oldLevel);
  const newIndex = arr.findIndex((item) => item === newLevel);

  return newIndex > oldIndex;
};

export const getFreeSubPlanPoints = () => {
  return (global.fatgptMainConfig?.subPlans?.standard?.free?.totalPoints || 10) * POINTS_SCALE;
};
