import { concatUsage } from '@/pages/api/support/wallet/usage/concatUsage';
import { ModelTypeEnum } from '@fastgpt/service/core/ai/model';
import { formatModelChars2Points } from '@fastgpt/service/support/wallet/usage/utils';

export const pushAutoTrainingUsage = async ({
  teamId,
  tmbId,
  model,
  tokens,
  billId
}: {
  teamId: string;
  tmbId: string;
  model: string;
  tokens: number;
  billId: string;
}) => {
  // 计算价格
  const { totalPoints } = formatModelChars2Points({
    model,
    modelType: ModelTypeEnum.llm,
    tokens
  });
  concatUsage({
    billId,
    teamId,
    tmbId,
    totalPoints,
    tokens,
    listIndex: 2
  });

  return { totalPoints };
};
