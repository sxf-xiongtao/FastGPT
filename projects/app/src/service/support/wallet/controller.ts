import { MongoTeam } from '../user/team/teamSchema';
import { addLog } from '@fastgpt/service/common/mongo/controller';

/* 
    amount: min unit
*/
export async function updateTeamBalance({ teamId, amount }: { teamId: string; amount: number }) {
  if (Math.abs(amount) < 50) {
    addLog.info('updateTeamBalance amount too small, maybe have error', { teamId, amount });
  }

  console.log('update balance', amount);

  await MongoTeam.findByIdAndUpdate(teamId, {
    $inc: { balance: amount }
  });
}
