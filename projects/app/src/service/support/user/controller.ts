import { authMaxUsers } from '@/service/support/user/auth';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import { ERROR_ENUM } from '@fastgpt/global/common/error/errorCode';
import { UserType } from '@fastgpt/global/support/user/type';
import { getAndCreateUserDefaultTeam, getUserTeamOrDefaultTeam } from './team/controller';
import { customAlphabet } from 'nanoid';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { sendInform2OneUser } from './inform/controller';
import { createJWT } from '@fastgpt/service/support/permission/controller';
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz1234567890', 8);
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';

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

  const { user, team } = await mongoSessionRun(async (session) => {
    const [user] = await MongoUser.create(
      [
        {
          username,
          avatar,
          password,
          inviterId
        }
      ],
      { session }
    );

    const team = await getAndCreateUserDefaultTeam(user._id, session);
    return {
      user,
      team
    };
  });

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

export async function usernameLogin({
  username,
  avatar,
  inviterId,
  tmbId
}: {
  username: string;
  avatar?: string;
  inviterId?: string;
  tmbId?: string;
}) {
  // try to login
  const user = await MongoUser.findOne({ username }, '_id');

  // register
  if (!user) {
    const password = nanoid();
    const user = await createUserByUsername({
      username,
      password: hashStr(password),
      avatar,
      inviterId
    });
    // send default password inform
    sendInform2OneUser({
      tmbId: user.team.tmbId,
      type: 'system',
      title: '新用户注册',
      content: `您的初始密码为: ${password}`
    });
    const token = createJWT(user);

    return {
      user,
      token
    };
  }

  // login
  const userInfo = await getUserDetail(tmbId, user._id);

  const token = createJWT(userInfo);

  return {
    user: userInfo,
    token
  };
}
