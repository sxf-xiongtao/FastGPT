import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { addLog } from '@fastgpt/service/common/mongo/controller';

/* 
    amount: min unit
*/
export async function updateTeamBalance({ teamId, amount }: { teamId: string; amount: number }) {
  if (Math.abs(amount) < 10) {
    addLog.info('updateTeamBalance amount too small, maybe have error', { teamId, amount });
  }

  addLog.info(`create bill`, {
    teamId,
    amount
  });

  await MongoTeam.findByIdAndUpdate(teamId, {
    $inc: { balance: amount }
  });
}
