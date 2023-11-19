import { authMaxUsers } from '@/service/support/user/auth';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/bill/constants';
import { ERROR_ENUM } from '@fastgpt/global/common/error/errorCode';
import { UserType } from '@fastgpt/global/support/user/type';
import { getUserDefaultTeam, getUserTeamOrDefaultTeam } from './team/controller';

/* create user and team */
export async function createUserByUsername({
  username,
  password,
  avatar,
  inviterId
}: {
  username: string;
  password: string;
  avatar?: string;
  inviterId?: string;
}): Promise<UserType> {
  await authMaxUsers();
  const user = await MongoUser.create({
    username,
    avatar,
    password,
    inviterId: inviterId ? inviterId : undefined,
    balance: (global.systemConfig.system?.userDefaultBalance || 2) * PRICE_SCALE
  });

  const team = await getUserDefaultTeam(user._id);

  return {
    _id: user._id,
    username: user.username,
    avatar: user.avatar,
    balance: user.balance,
    timezone: user.timezone,
    promotionRate: user.promotionRate,
    openaiAccount: user.openaiAccount,
    team: team
  };
}

export async function getUserDetail(tmbId?: string, userId?: string): Promise<UserType> {
  const team = await getUserTeamOrDefaultTeam(tmbId, userId);
  const user = await MongoUser.findById(team.userId);

  if (!user) {
    return Promise.reject(ERROR_ENUM.unAuthorization);
  }

  return {
    _id: user._id,
    username: user.username,
    avatar: user.avatar,
    balance: user.balance,
    timezone: user.timezone,
    promotionRate: user.promotionRate,
    openaiAccount: user.openaiAccount,
    team
  };
}
