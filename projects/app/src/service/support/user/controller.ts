import { authMaxUsers } from '@/service/support/user/auth';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { ERROR_ENUM } from '@fastgpt/global/common/error/errorCode';
import { UserType } from '@fastgpt/global/support/user/type';
import { getAndCreateUserDefaultTeam, getUserTeamOrDefaultTeam } from './team/controller';
import { getNanoid, hashStr } from '@fastgpt/global/common/string/tools';
import { sendInform2OneUser } from './inform/controller';
import { createJWT } from '@fastgpt/service/support/permission/controller';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { InformLevelEnum } from '@fastgpt/global/support/user/inform/constants';

type UserProps = {
  username: string;
  email?: string;
  phonePrefix?: number;
  phone?: string;
  avatar?: string;
  inviterId?: string;
};

/* create user and team */
export async function createUserByUsername({
  username,
  password,
  email,
  phone,
  phonePrefix,
  avatar,
  inviterId
}: UserProps & {
  password: string;
}): Promise<UserType> {
  await authMaxUsers();

  const { user, team } = await mongoSessionRun(async (session) => {
    const [user] = await MongoUser.create(
      [
        {
          username,
          avatar,
          password,
          inviterId,
          email,
          phone,
          phonePrefix
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
    timezone: user.timezone,
    promotionRate: user.promotionRate,
    openaiAccount: user.openaiAccount,
    team
  };
}

/* 通过用户名快速登录，要求前置校验是否有登录权限 */
export async function usernameLogin({
  username,
  avatar,
  email,
  phonePrefix,
  phone,
  inviterId
}: UserProps) {
  // try to login
  const user = await MongoUser.findOne({ username }, '_id lastLoginTmbId');

  // register
  if (!user) {
    const password = getNanoid();
    const user = await createUserByUsername({
      username,
      password: hashStr(password),
      email,
      phonePrefix,
      phone,
      avatar,
      inviterId
    });
    // send default password inform
    sendInform2OneUser({
      level: InformLevelEnum.common,
      tmbId: user.team.tmbId,
      title: '新用户注册',
      content: `您的初始密码为: ${password}`
    });
    const token = createJWT(user);

    return {
      user,
      token
    };
  } else {
    // update user
    if (email || phone) {
      await user.updateOne({
        email,
        phonePrefix,
        phone
      });
    }
  }

  // login
  const userInfo = await getUserDetail(user.lastLoginTmbId, user._id);

  const token = createJWT(userInfo);

  return {
    user: userInfo,
    token
  };
}
