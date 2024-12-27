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
import { Types } from '@fastgpt/service/common/mongo';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';

type UserProps = {
  username: string;
  phonePrefix?: number;
  notificationAccount?: string;
  avatar?: string;
  inviterId?: string;
  fastgpt_sem?: {
    keyword: string;
  };
  sourceDomain?: string;
};

/* create user and team */
export async function createUserByUsername({
  username,
  password,
  phonePrefix,
  avatar,

  teamName,
  memberName,

  inviterId,
  notificationAccount,
  fastgpt_sem,
  sourceDomain
}: UserProps & {
  teamName?: string;
  memberName?: string;
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
          phonePrefix,
          inviterId: inviterId && Types.ObjectId.isValid(inviterId) ? inviterId : undefined,
          fastgpt_sem,
          sourceDomain
        }
      ],
      { session }
    );

    // username: email;phone;git-xxx;google-xxx
    const formatTeamName = (() => {
      if (teamName) return teamName;
      const splitUsername = username.split('-');
      if (splitUsername.length > 1) {
        return splitUsername[1];
      }
      return splitUsername[0];
    })();
    const team = await getAndCreateUserDefaultTeam({
      ownerId: user._id,
      notificationAccount,
      teamName: `${formatTeamName.slice(0, 10)} Team`,
      memberName,
      teamAvatar: avatar,
      session
    });
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
    team: team,
    permission: new TeamPermission({
      isOwner: true
    })
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
    team,
    permission: team.permission
  };
}

/* 通过用户名快速登录，要求前置校验是否有登录权限 */
export async function usernameLogin({
  username,
  avatar,
  notificationAccount,
  phonePrefix,

  teamName,
  memberName,

  inviterId,
  fastgpt_sem,
  sourceDomain
}: UserProps & {
  teamName?: string;
  memberName?: string;
}) {
  // try to login
  const user = await MongoUser.findOne({ username }, '_id lastLoginTmbId');

  // register
  if (!user) {
    const password = getNanoid();
    const user = await createUserByUsername({
      username,
      password: hashStr(password),
      avatar,
      notificationAccount,
      phonePrefix,

      teamName,
      memberName,

      inviterId,
      fastgpt_sem,
      sourceDomain
    });
    // send default password inform
    sendInform2OneUser({
      level: InformLevelEnum.common,
      teamId: user.team.teamId,
      templateCode: 'CUSTOM',
      templateParam: {
        title: '新用户注册',
        content: `您的初始密码为: ${password}`
      }
    });
    const token = createJWT(user);

    return {
      user,
      token
    };
  }

  // login
  const userInfo = await getUserDetail(user.lastLoginTmbId, user._id);

  const token = createJWT(userInfo);

  return {
    user: userInfo,
    token
  };
}
