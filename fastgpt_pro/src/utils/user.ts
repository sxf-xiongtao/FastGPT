import { PRICE_SCALE } from '@/constants/common';

/**
 * 把数据库读取到的price，转化成元
 */
export const formatPrice = (val = 0, multiple = 1) => {
  return Number(((val / PRICE_SCALE) * multiple).toFixed(10));
};
