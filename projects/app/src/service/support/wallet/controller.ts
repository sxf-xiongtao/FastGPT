import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { addLog } from '@fastgpt/service/common/mongo/controller';
import { delay } from '@fastgpt/global/common/system/utils';

/* 
    amount: min unit
*/
export async function updateTeamBalance({ teamId, amount }: { teamId: string; amount: number }) {
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
    await delay(1000);
    return updateTeamBalance({ teamId, amount });
  }
}
