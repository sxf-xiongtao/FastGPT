import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import {
  StandardSubLevelEnum,
  SubModeEnum,
  SubStatusEnum,
  SubTypeEnum
} from '@fastgpt/global/support/wallet/sub/constants';
import { ClientSession } from '@fastgpt/service/common/mongo';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { addMonths } from 'date-fns';

export const initTeamSubPlan2Free = async ({
  teamId,
  session
}: {
  teamId: string;
  session?: ClientSession;
}) => {
  const freePoints = getFreeSubPlanPoints();

  const teamStandardSub = await MongoTeamSub.findOne({ teamId, type: SubTypeEnum.standard });

  if (teamStandardSub) {
    teamStandardSub.status = SubStatusEnum.active;
    teamStandardSub.currentMode = SubModeEnum.month;
    teamStandardSub.nextMode = SubModeEnum.month;
    teamStandardSub.startTime = new Date();
    teamStandardSub.expiredTime = addMonths(new Date(), 1);

    teamStandardSub.currentSubLevel = StandardSubLevelEnum.free;
    teamStandardSub.nextSubLevel = StandardSubLevelEnum.free;

    teamStandardSub.price = 0;
    teamStandardSub.pointPrice = 0;

    teamStandardSub.totalPoints = freePoints;
    teamStandardSub.surplusPoints = freePoints;
    return teamStandardSub.save({ session });
  }

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

/* 1k size price */
export const getExtraDatasetSizePrice = (type?: 'read' | 'store') => {
  const scale = type === 'read' ? 1 : PRICE_SCALE;
  return (global.fatgptMainConfig?.subPlans?.extraDatasetSize?.price || 0) * scale;
};
/* 100w points price */
export const getExtraPointsPrice = (type?: 'read' | 'store') => {
  const scale = type === 'read' ? 1 : PRICE_SCALE;
  return (global.fatgptMainConfig?.subPlans?.extraPoints?.price || 0) * scale;
};

export const getStandardPlan = (level: `${StandardSubLevelEnum}`) => {
  return global.fatgptMainConfig?.subPlans?.standard?.[level];
};
export const getStandardPlans = () => {
  return global.fatgptMainConfig?.subPlans?.standard;
};
export const openSubPlaning = () => !!global.fatgptMainConfig?.subPlans?.standard?.free;

/**
 * 获取较高级的一个level
 */
export const getLargeStandardSubLevel = (levelList: `${StandardSubLevelEnum}`[]) => {
  const arr: `${StandardSubLevelEnum}`[] = [
    StandardSubLevelEnum.free,
    StandardSubLevelEnum.experience,
    StandardSubLevelEnum.team,
    StandardSubLevelEnum.enterprise
  ];

  let level = levelList[0];
  for (let i = 1; i < levelList.length; i++) {
    if (arr.indexOf(levelList[i]) > arr.indexOf(level)) {
      level = levelList[i];
    }
  }
  return level;
};

export const getFreeSubPlanPoints = () => {
  return global.fatgptMainConfig?.subPlans?.standard?.free?.totalPoints || 100;
};
