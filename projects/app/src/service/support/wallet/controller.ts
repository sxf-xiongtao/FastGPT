import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { addLog } from '@fastgpt/service/common/system/log';
import { delay } from '@fastgpt/global/common/system/utils';

/* 
    amount: min unit
*/
export async function updateTeamBalance({
  teamId,
  amount,
  retry = 3
}: {
  teamId: string;
  amount: number;
  retry?: number;
}): Promise<any> {
  if (Math.abs(amount) < 10) {
    addLog.info('updateTeamBalance amount too small, maybe have error', { teamId, amount });
  }

  addLog.info(`update balance`, {
    teamId,
    amount
  });

  try {
    await MongoTeam.findByIdAndUpdate(teamId, {
      $inc: { balance: amount }
    });
  } catch (error) {
    console.log(error, retry);

    if (retry > 0) {
      await delay(100);
      return updateTeamBalance({ teamId, amount, retry: retry - 1 });
    }
  }
}
