import { UserErrEnum } from '@fastgpt/global/common/error/code/user';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';

export const authTeamBalance = async (teamId: string, minBalance = 0) => {
  const team = await MongoTeam.findById(teamId, '_id balance');

  if (!team || team.balance < minBalance) {
    return Promise.reject(UserErrEnum.balanceNotEnough);
  }
};
