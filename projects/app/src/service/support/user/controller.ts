import { authMaxUsers } from '@/service/support/user/auth';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { PRICE_SCALE } from '@fastgpt/global/common/bill/constants';
import { ERROR_ENUM } from '@fastgpt/global/common/error/errorCode';
import { UserType } from '@fastgpt/global/support/user/type';
import { authTeamRole } from './team/controller';

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
}) {
  await authMaxUsers();
  const response = await MongoUser.create({
    username,
    avatar,
    password,
    inviterId: inviterId ? inviterId : undefined,
    balance: (global.systemConfig.system?.userDefaultBalance || 2) * PRICE_SCALE
  });

  const user = response.toJSON();
  // @ts-ignore
  delete user.password;

  return user;
}

export async function getUserDetail(userId: string, tmbId?: string): Promise<UserType> {
  const [user, team] = await Promise.all([
    MongoUser.findById(userId),
    (async () => {
      if (tmbId) {
        try {
          const team = await authTeamRole({ userId, tmbId });
          return team;
        } catch (error) {}
      }
    })()
  ]);

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
