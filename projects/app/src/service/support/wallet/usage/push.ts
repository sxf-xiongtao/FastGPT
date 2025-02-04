import { concatUsage } from '@/pages/api/support/wallet/usage/concatUsage';
import { ChatNodeUsageType } from '@fastgpt/global/support/wallet/bill/type';
import { CreateUsageProps } from '@fastgpt/global/support/wallet/usage/api';
import { UsageSourceEnum } from '@fastgpt/global/support/wallet/usage/constants';
import { addLog } from '@fastgpt/service/common/system/log';
import { ModelTypeEnum } from '@fastgpt/global/core/ai/model';
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';
import { formatModelChars2Points } from '@fastgpt/service/support/wallet/usage/utils';
import { pushReduceTeamAiPointsTask } from '../controller';

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

export const pushChatUsage = ({
  appName,
  appId,
  pluginId,
  teamId,
  tmbId,
  source,
  flowUsages
}: {
  appName: string;
  appId?: string;
  pluginId?: string;
  teamId: string;
  tmbId: string;
  source: `${UsageSourceEnum}`;
  flowUsages: ChatNodeUsageType[];
}) => {
  const totalPoints = flowUsages.reduce((sum, item) => sum + (item.totalPoints || 0), 0);

  createUsage({
    teamId,
    tmbId,
    appName,
    appId,
    pluginId,
    totalPoints,
    source,
    list: flowUsages.map((item) => ({
      moduleName: item.moduleName,
      amount: item.totalPoints || 0,
      model: item.model,
      inputTokens: item.inputTokens,
      outputTokens: item.outputTokens
    }))
  });

  addLog.info(`finish completions`, {
    source,
    teamId,
    totalPoints
  });
  return { totalPoints };
};

export const createUsage = (data: CreateUsageProps) => {
  return Promise.all([
    MongoUsage.create(data),
    pushReduceTeamAiPointsTask({ teamId: data.teamId, totalPoints: data.totalPoints })
  ]);
};
