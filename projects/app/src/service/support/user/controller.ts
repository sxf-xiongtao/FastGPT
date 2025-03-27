import { authMaxUsers } from '@/service/support/user/auth';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { UserType } from '@fastgpt/global/support/user/type';
import { getAndCreateUserDefaultTeam, getTeamByUsername } from './team/controller';
import { getNanoid, hashStr } from '@fastgpt/global/common/string/tools';
import { sendInform2OneUser } from './inform/controller';
import { createJWT } from '@fastgpt/service/support/permission/controller';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { InformLevelEnum } from '@fastgpt/global/support/user/inform/constants';
import { ClientSession, Types } from '@fastgpt/service/common/mongo';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { UserStatusEnum } from '@fastgpt/global/support/user/constant';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';
import { SyncOrgSourceEnum } from '@fastgpt/global/support/user/team/org/constant';
import { MongoOrgMemberModel } from '@fastgpt/service/support/permission/org/orgMemberSchema';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { GroupMemberRole } from '@fastgpt/global/support/permission/memberGroup/constant';
import { changeOwner } from '@/service/core/changeOwner';
import { getGroupsByTmbId } from '@fastgpt/service/support/permission/memberGroup/controllers';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { getIsSyncUser } from '@/global/support/user/constants';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { TeamReadPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { addLog } from '@fastgpt/service/common/system/log';
import { TeamModeEnum } from '@/global/settings/constants';
import { TeamTmbItemType } from '@fastgpt/global/support/user/team/type';

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

/**
 * create user and team
 * if createDefaultTeam is true, will create a default team.
 * if defaultTeamIdList is not empty, will create a default team with the id list.
 * if defaultTeamIdList is empty, will join the root team.
 * */
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
  sourceDomain,
  defaultTeamIdList: _defaultTeamIdList = []
}: UserProps & {
  teamName?: string;
  memberName?: string;
  password: string;
  defaultTeamIdList?: string[]; // invite user to register/Sync user
}): Promise<UserType> {
  if (global.systemConfig.teamMode === TeamModeEnum.sync) {
    return Promise.reject('You can not create user in sync mode');
  }

  const createDefaultTeam =
    !global.systemConfig.teamMode || global.systemConfig.teamMode === TeamModeEnum.multi;
  const defaultTeamIdList =
    global.systemConfig.teamMode === TeamModeEnum.single
      ? [String((await getTeamByUsername('root'))._id)]
      : _defaultTeamIdList;

  await authMaxUsers();
  const { user, tmb } = await mongoSessionRun(async (session) => {
    //1. create user
    const [user] = await MongoUser.create(
      [
        {
          username,
          password,
          phonePrefix,
          inviterId: inviterId && Types.ObjectId.isValid(inviterId) ? inviterId : undefined,
          fastgpt_sem,
          sourceDomain,
          contact: notificationAccount
        }
      ],
      { session }
    );

    //2. create or join team
    const tmb = await (async () => {
      let tmb: TeamTmbItemType | undefined;

      if (createDefaultTeam) {
        // username: email;phone;git-xxx;google-xxx
        const formatTeamName = (() => {
          if (teamName) return teamName;
          const splitUsername = username.split('-');
          if (splitUsername.length > 1) {
            return splitUsername[1];
          }
          return splitUsername[0];
        })();
        tmb = await getAndCreateUserDefaultTeam({
          ownerId: user._id,
          notificationAccount,
          teamName: `${formatTeamName.slice(0, 10)} Team`,
          memberName: memberName || user.username,
          teamAvatar: avatar,
          memberAvatar: avatar,
          session
        });
      }

      // Join default teams
      if (defaultTeamIdList && defaultTeamIdList.length > 0) {
        const teams = await MongoTeam.find({ _id: { $in: defaultTeamIdList } }, '_id');
        if (!teams.length) return Promise.reject('default team not exist');

        const tmbs = await MongoTeamMember.create(
          teams.map((team) => ({
            teamId: team._id,
            userId: user._id,
            name: memberName || user.username,
            status: TeamMemberStatusEnum.active,
            createTime: new Date()
          })),
          { session }
        );

        tmb = {
          ...tmbs[0].toObject(),
          memberName: memberName || user.username,
          userId: user._id,
          teamId: tmbs[0].teamId,
          teamName: teams[0].name,
          tmbId: tmbs[0]._id,
          teamDomain: teams[0].teamDomain,
          permission: new TeamPermission({
            per: TeamReadPermissionVal
          })
        };
      }

      if (tmb) return tmb;

      return Promise.reject(
        'no team create or join team, please check the createDefaultTeam and defaultTeamIdList'
      );
    })();

    return { user, tmb };
  });

  return {
    _id: user._id,
    username: user.username,
    avatar: tmb.avatar,
    timezone: user.timezone,
    promotionRate: user.promotionRate,
    team: tmb,
    permission: new TeamPermission({
      isOwner: true
    })
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
  const user = await MongoUser.findOne({ username });

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
      userId: user._id,
      templateCode: 'CUSTOM',
      templateParam: {
        title: '新用户注册',
        content: `您的初始密码为: ${password}`
      }
    });

    return {
      user,
      token: createJWT(user)
    };
  }

  try {
    if (notificationAccount) {
      if (getIsSyncUser()) {
        user.contact = notificationAccount;
        await user.save();
      } else if (!user.contact) {
        user.contact = notificationAccount;
        await user.save();
      }
    }
  } catch (error) {
    addLog.warn('usernameLogin user contact update error', {
      error
    });
  }

  // login
  const userInfo = await getUserDetail({ tmbId: user.lastLoginTmbId, userId: user._id });

  const token = createJWT(userInfo);

  return {
    user: userInfo,
    token
  };
}

export type SyncUserParams = {
  teamId: string;
  latestUserList: {
    userid: string;
    name?: string;
    contact?: string;
    avatar?: string;
  }[];
  source: `${SyncOrgSourceEnum}`;
  session?: ClientSession;
};

/** Sync The Team Members
 * delete un-exist users
 * create new users
 * */
export async function syncUser({ teamId, latestUserList, source, session }: SyncUserParams) {
  const func = async (session: ClientSession) => {
    // 1. get users we have now, and filter with the prefix 'wecom-'...
    const tmbs = await MongoTeamMember.find(
      {
        teamId
      },
      '_id userId',
      { session }
    ).lean();

    const usersInDB = (
      await MongoUser.find(
        {
          _id: { $in: tmbs.map((tmb) => tmb.userId) }
        },
        undefined,
        { session }
      ).lean()
    ).filter((user) => user.username.startsWith(source) && user.username !== 'root');

    // 2. remove deleted users
    const newUserIds = latestUserList.map((item) => item.userid);
    const deletedUsers = usersInDB.filter(
      (user) => !newUserIds.includes(user.username.split('-')[1])
    );

    const deletedTmbUsers = tmbs.filter((tmb) => {
      return deletedUsers.map((user) => String(user._id)).includes(String(tmb.userId));
    });

    // 2.1 remove user from team
    for await (const tmb of deletedTmbUsers) {
      await removeUserFromTeam({ teamId, memberId: tmb._id, session });
    }

    // 2.2 disable the deleted users
    await MongoUser.updateMany(
      {
        _id: { $in: deletedUsers.map((item) => item._id) }
      },
      {
        status: UserStatusEnum.forbidden
      },
      { session }
    );

    // 3. create new users (without default team)
    const newUsers = latestUserList.filter((user) => {
      return !usersInDB.map((item) => item.username).includes(`${source}-${user.userid}`);
    });

    for await (const user of newUsers) {
      // create user
      const [u] = await MongoUser.create(
        [
          {
            username: `${source}-${user.userid}`,
            avatar: user.avatar,
            status: UserStatusEnum.active,
            password: getNanoid()
          }
        ],
        { session, ordered: true }
      );

      // create tmb
      await MongoTeamMember.create(
        [
          {
            teamId,
            userId: u._id,
            name: user.name,
            status: TeamMemberStatusEnum.active,
            createTime: new Date()
          }
        ],
        { session, ordered: true }
      );
    }
  };

  if (session) {
    await func(session);
  } else {
    await mongoSessionRun(func);
  }
}
/** Sync the Org */
export type syncOrgParams = {
  teamId: string;
  latestOrgList: {
    pathId: string; // this should be unique
    path: string; // "org1/org2/org3/pathid"
    name: string;
    tmbIds: string[];
  }[];
  session?: ClientSession;
};

export async function syncOrg({ teamId, latestOrgList: orgs, session }: syncOrgParams) {
  const permissions = await MongoResourcePermission.find(
    {
      teamId,
      orgId: {
        $exists: true
      }
    },
    undefined,
    { session }
  ).lean();

  const oldOrgs = await MongoOrgModel.find({ teamId }, undefined, { session });
  const pathId_oldOrgMap = new Map<string, string>();

  oldOrgs.forEach((org) => {
    pathId_oldOrgMap.set(String(org.pathId), String(org._id));
  });

  // 2. Delete all orgs of a team
  await Promise.all([
    MongoOrgModel.deleteMany({ teamId }, { session }),
    MongoOrgMemberModel.deleteMany({ teamId }, { session }),
    MongoResourcePermission.deleteMany(
      {
        teamId,
        orgId: {
          $exists: true
        }
      },
      { session }
    )
  ]);

  // 3. create new orgs
  for (const org of orgs) {
    // 3.1 create new orgs
    const [newOrg] = await MongoOrgModel.create(
      [
        {
          teamId,
          name: org.name,
          pathId: org.pathId,
          path: org.path
        }
      ],
      { session, ordered: true }
    );
    // 3.2 add members
    for (const tmbId of org.tmbIds) {
      await MongoOrgMemberModel.create(
        [
          {
            teamId,
            orgId: newOrg._id,
            tmbId
          }
        ],
        { session, ordered: true }
      );
    }

    const pers = permissions.filter((p) => {
      if (!p.orgId) return;
      const oldOrgId = pathId_oldOrgMap.get(String(org.pathId));
      if (String(p.orgId) === String(oldOrgId)) {
        return true;
      }
      return false;
    });

    // 3.3 add resource Permissions
    await MongoResourcePermission.create(
      pers.map((per) => ({
        teamId,
        orgId: newOrg._id,
        permission: per.permission,
        resourceType: per.resourceType,
        resourceId: per.resourceId
      })),
      { session, ordered: true }
    );
  }
}
/** remove user from team */
export async function removeUserFromTeam({
  teamId,
  memberId,
  session
}: {
  teamId: string;
  memberId: string;
  session?: ClientSession;
}) {
  const removeTmb = await MongoTeamMember.findOne(
    {
      teamId,
      _id: memberId
    },
    undefined,
    { session }
  );
  if (!removeTmb) {
    return Promise.reject('member not exist');
  }

  const ownerTmb = await MongoTeamMember.findOne(
    {
      teamId,
      role: TeamMemberRoleEnum.owner
    },
    undefined,
    { session }
  );
  if (!ownerTmb) {
    return Promise.reject('owner not exist');
  }

  const memberTmbId = String(memberId);
  const teamOwnerTmbId = String(ownerTmb._id);

  if (teamOwnerTmbId === memberTmbId) {
    return Promise.reject('owner can not be deleted');
  }

  // Transfer source
  const func = async (session: ClientSession) => {
    // Transfer group to team owner
    const groups = await getGroupsByTmbId({
      tmbId: memberTmbId,
      teamId,
      role: [GroupMemberRole.owner]
    });
    // update group member owner
    await MongoGroupMemberModel.updateMany(
      {
        groupId: { $in: groups.map((group) => String(group._id)) },
        tmbId: teamOwnerTmbId
      },
      {
        role: GroupMemberRole.owner
      },
      {
        upsert: true,
        session
      }
    );
    // Delete group member
    // await MongoGroupMemberModel.deleteMany(
    //   {
    //     tmbId: memberTmbId
    //   },
    //   { session }
    // );
    // Delete org member
    // await MongoOrgMemberModel.deleteMany(
    //   {
    //     teamId,
    //     tmbId: memberTmbId
    //   },
    //   { session }
    // );

    // Transfer permission
    await changeOwner({
      teamId,
      changeOwnerType: 'app',
      newOwnerId: teamOwnerTmbId,
      oldOwnerId: memberTmbId,
      session
    });

    await changeOwner({
      teamId,
      changeOwnerType: 'dataset',
      newOwnerId: teamOwnerTmbId,
      oldOwnerId: memberTmbId,
      session
    });

    // Delete permission
    await MongoResourcePermission.deleteMany(
      {
        resourceType: { $exists: true },
        teamId,
        tmbId: memberTmbId
      },
      { session }
    );

    // Update member status to leave or forbidden
    // if isSyncUser, will forbidden -> could be restored
    // if not isSyncUser, will leave -> could not be restored, only re-invite
    removeTmb.status = getIsSyncUser()
      ? TeamMemberStatusEnum.forbidden
      : TeamMemberStatusEnum.leave;

    removeTmb.updateTime = new Date();
    await removeTmb.save({ session });
  };

  if (session) {
    await func(session);
  } else {
    await mongoSessionRun(func);
  }
}
