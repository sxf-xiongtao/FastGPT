import { ConcatUsageProps, CreateUsageProps } from '@fastgpt/global/support/wallet/usage/api';
import { Types } from '@fastgpt/service/common/mongo';
import { addLog } from '@fastgpt/service/common/system/log';
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';

const pushReduceTeamAiPointsTask = ({
  teamId,
  totalPoints
}: {
  teamId: string;
  totalPoints: number;
}) => {
  global.reduceAiPointsQueue.push({
    teamId: String(teamId),
    totalPoints
  });
};

export const createUsageRequest = async (data: CreateUsageProps) => {
  // In FastGPT pro server
  await MongoUsage.create(data);
  pushReduceTeamAiPointsTask({ teamId: data.teamId, totalPoints: data.totalPoints });

  if (data.totalPoints === 0) {
    addLog.info('0 totalPoints', data);
  }
};

export const concatUsageRequest = async (data: ConcatUsageProps) => {
  const { teamId, billId, totalPoints = 0, listIndex, inputTokens = 0, outputTokens = 0 } = data;

  // billId is required and valid
  if (!billId || !Types.ObjectId.isValid(billId)) return;

  // In FastGPT pro server
  global.concatBillQueue.push({
    billId,
    listIndex,
    inputTokens,
    outputTokens,
    totalPoints
  });
  pushReduceTeamAiPointsTask({ teamId, totalPoints });

  if (data.totalPoints === 0) {
    addLog.info('0 totalPoints', data);
  }
};
