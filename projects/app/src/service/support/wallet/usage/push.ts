import { ModelTypeEnum } from '@fastgpt/global/core/ai/model';
import { concatUsage } from '@fastgpt/service/support/wallet/usage/controller';
import { formatModelChars2Points } from '@fastgpt/service/support/wallet/usage/utils';

export const pushAutoTrainingUsage = async ({
  teamId,
  tmbId,
  model,
  inputTokens,
  outputTokens,
  billId
}: {
  teamId: string;
  tmbId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  billId: string;
}) => {
  // 计算价格
  const { totalPoints } = formatModelChars2Points({
    model,
    modelType: ModelTypeEnum.llm,
    inputTokens,
    outputTokens
  });
  concatUsage({
    billId,
    teamId,
    tmbId,
    totalPoints,
    inputTokens,
    outputTokens,
    listIndex: 2
  });

  return { totalPoints };
};

export const pushImageParseUsage = async ({
  teamId,
  tmbId,
  model,
  inputTokens,
  outputTokens,
  billId
}: {
  teamId: string;
  tmbId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  billId: string;
}) => {
  // 计算价格
  const { totalPoints } = formatModelChars2Points({
    model,
    modelType: ModelTypeEnum.llm,
    inputTokens,
    outputTokens
  });
  concatUsage({
    billId,
    teamId,
    tmbId,
    totalPoints,
    inputTokens,
    outputTokens,
    listIndex: 3
  });

  return { totalPoints };
};
