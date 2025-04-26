import { BillTypeEnum } from '@fastgpt/global/support/wallet/bill/constants';

export const BillTypeDescriptionMap: Record<BillTypeEnum, string> = {
  [BillTypeEnum.balance]: '余额充值',
  [BillTypeEnum.standSubPlan]: '套餐订阅',
  [BillTypeEnum.extraDatasetSub]: '额外知识库存储',
  [BillTypeEnum.extraPoints]: '额外AI积分'
} as const;

export const getPaymentDescription = (type: BillTypeEnum, systemTitle: string) => {
  return `${systemTitle} ${BillTypeDescriptionMap[type]}`;
};
