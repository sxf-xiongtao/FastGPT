import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import { StandardSubLevelEnum } from '@fastgpt/global/support/wallet/sub/constants';

/* 1k size price */
export const getExtraDatasetSizePrice = (type?: 'read' | 'store') => {
  const scale = type === 'read' ? 1 : PRICE_SCALE;
  return (global?.subPlans?.extraDatasetSize?.price || 0) * scale;
};
/* 1000 points price */
export const getExtraPointsPrice = (type?: 'read' | 'store') => {
  const scale = type === 'read' ? 1 : PRICE_SCALE;
  return (global?.subPlans?.extraPoints?.price || 0) * scale;
};

export const systemUseTeamPlanning = () => !!global?.subPlans?.standard?.free;

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
