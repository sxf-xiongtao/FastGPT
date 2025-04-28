import { TeamModeEnum } from '@/global/settings/constants';
import { changeOwner } from '@/service/core/changeOwner';
import { authMaxUsers } from '@/service/support/user/auth';
import { getNanoid, hashStr } from '@fastgpt/global/common/string/tools';
import { GroupMemberRole } from '@fastgpt/global/support/permission/memberGroup/constant';
import { TeamReadPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { UserStatusEnum } from '@fastgpt/global/support/user/constant';
import { InformLevelEnum } from '@fastgpt/global/support/user/inform/constants';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';
import { TeamTmbItemType } from '@fastgpt/global/support/user/team/type';
import { UserType } from '@fastgpt/global/support/user/type';
import { ClientSession, Types } from '@fastgpt/service/common/mongo';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { addLog } from '@fastgpt/service/common/system/log';
import { createJWT } from '@fastgpt/service/support/permission/controller';
import { getGroupsByTmbId } from '@fastgpt/service/support/permission/memberGroup/controllers';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { MongoOrgMemberModel } from '@fastgpt/service/support/permission/org/orgMemberSchema';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { sendInform2OneUser } from './inform/controller';
import { getAndCreateUserDefaultTeam, getTeamByUsername } from './team/controller';

type UserProps = {
  username: string;
  phonePrefix?: number;
  notificationAccount?: string;
  avatar?: string;
  inviterId?: string;
  fastgpt_sem?: {
    keyword?: string;
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
      if (global.systemConfig.teamMode === TeamModeEnum.sync) {
        user.contact = notificationAccount;
        await user.save();
      } else if (!user.contact) {
        user.contact = notificationAccount;
        await user.save();
      }
    }
    if (memberName && global.systemConfig.teamMode === TeamModeEnum.sync) {
      await MongoTeamMember.updateOne(
        {
          userId: user._id
        },
        {
          name: memberName
        }
      );
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
    username: string;
    memberName?: string;
    contact?: string;
    avatar?: string;
  }[];
  // source: `${SyncOrgSourceEnum}`;
  session?: ClientSession;
};

/** Sync The Team Members
 * delete un-exist users
 * create new users
 * */
export async function syncUser({ teamId, latestUserList, session }: SyncUserParams) {
  addLog.debug(`syncing users start, users count: ${latestUserList.length}`);
  if (!latestUserList.length) {
    return;
  }

  const prefix = latestUserList[0].username.split('-')[0];
  // 1. get users we have now, and filter with the prefix
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
        _id: { $in: tmbs.map((tmb) => tmb.userId) },
        username: { $regex: new RegExp(`^${prefix}`) }
      },
      undefined,
      { session }
    ).lean()
  ).filter((user) => user.username.startsWith(prefix) && user.username !== 'root');

  // 2. remove deleted users
  const newUserIds = latestUserList.map((item) => item.username);
  const deletedUsers = usersInDB.filter((user) => !newUserIds.includes(user.username));

  const deletedTmbUsers = tmbs.filter((tmb) => {
    return deletedUsers.map((user) => String(user._id)).includes(String(tmb.userId));
  });

  addLog.debug(
    `syncing users, deleted users count: ${deletedUsers.length}, ${deletedUsers.map((item) => item.username).join(', ')}`
  );
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
    return !usersInDB.map((item) => item.username).includes(user.username);
  });

  addLog.debug(`syncing users, new users count: ${newUsers.length}`);

  const userOps = [];
  const teamMemberOps = [];

  for (const user of newUsers) {
    userOps.push({
      insertOne: {
        document: {
          username: user.username,
          avatar: user.avatar,
          status: UserStatusEnum.active,
          password: getNanoid(),
          contact: user.contact
        }
      }
    });
    teamMemberOps.push({
      insertOne: {
        document: {
          teamId,
          userId: null,
          name: user.memberName || user.username,
          status: TeamMemberStatusEnum.active,
          createTime: new Date()
        }
      }
    });
  }

  const userResult = await MongoUser.bulkWrite(userOps, { session, ordered: true });
  const userIdMap = new Map<string, Types.ObjectId>();
  Object.entries(userResult.insertedIds).forEach(([index, userId]) => {
    userIdMap.set(newUsers[Number(index)].username, userId);
  });
  teamMemberOps.forEach((op, index) => {
    op.insertOne.document.userId = userIdMap.get(newUsers[index].username) as any;
  });

  await MongoTeamMember.bulkWrite(teamMemberOps, { session, ordered: true });
  addLog.debug(`syncing users end`);
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

export async function syncOrg({ teamId, latestOrgList, session }: syncOrgParams) {
  addLog.debug(`syncOrg: latestOrgLength: ${latestOrgList.length}`);
  const oldPermissions = await MongoResourcePermission.find(
    {
      teamId,
      orgId: {
        $exists: true
      }
    },
    undefined,
    { session }
  ).lean();

  const oldOrgId_pathId_Map = await (async () => {
    const oldOrgs = await MongoOrgModel.find({ teamId }, undefined, { session }).lean();
    const map = new Map<string, string>();
    oldOrgs.forEach((org) => {
      map.set(String(org._id), String(org.pathId));
    });
    return map;
  })();

  // 2. Delete all orgs of a team
  addLog.debug(`syncOrg: clean old orgs`);
  await Promise.all([
    MongoOrgModel.deleteMany({ teamId }, { session }),
    MongoOrgMemberModel.deleteMany({ teamId }, { session })
    // MongoResourcePermission.deleteMany(
    //   {
    //     teamId,
    //     orgId: {
    //       $exists: true
    //     }
    //   },
    //   { session }
    // )
  ]);

  // 3. create new orgs
  addLog.debug(`syncOrg: create new orgs`);
  const createOrgResult = await MongoOrgModel.bulkWrite(
    latestOrgList.map((org) => ({
      insertOne: {
        document: {
          teamId,
          name: org.name,
          pathId: org.pathId,
          path: org.path
        }
      }
    })),
    { session, ordered: true }
  );

  const orgMemberOps = [];
  for (const [index, org] of latestOrgList.entries()) {
    for (const tmbId of org.tmbIds) {
      orgMemberOps.push({
        insertOne: {
          document: {
            teamId,
            orgId: createOrgResult.insertedIds[index],
            tmbId
          }
        }
      });
    }
  }
  await MongoOrgMemberModel.bulkWrite(orgMemberOps, { session, ordered: true });

  addLog.debug(`syncOrg: add resourcePermissions`);
  const resourcePermissionOps = [];
  for (const per of oldPermissions) {
    if (!per.orgId) continue;
    const oldOrgId = per.orgId;
    const pathId = oldOrgId_pathId_Map.get(String(oldOrgId));
    const newOrgIndex = latestOrgList.findIndex((i) => i.pathId === pathId);
    if (newOrgIndex === -1) continue;
    resourcePermissionOps.push({
      updateOne: {
        filter: {
          teamId,
          orgId: oldOrgId,
          resourceType: per.resourceType,
          resourceId: per.resourceId,
          permission: per.permission
        },
        update: {
          orgId: createOrgResult.insertedIds[newOrgIndex]
        }
      }
    });
  }
  console.log(JSON.stringify(resourcePermissionOps));
  await MongoResourcePermission.bulkWrite(resourcePermissionOps, { session, ordered: true });
  // const pers = permissions.filter((p) => {
  //   if (!p.orgId) return;
  //   const oldOrgId = pathId_oldOrgMap.get(String(org.pathId));
  //   if (String(p.orgId) === String(oldOrgId)) {
  //     return true;
  //   }
  //   return false;
  // });

  // for (const per of pers) {
  //   resourcePermissionOps.push({
  //     insertOne: {
  //       document: {
  //         teamId,
  //         orgId: createOrgResult.insertedIds[Number(per.orgId)],
  //         permission: per.permission,
  //         resourceType: per.resourceType,
  //         resourceId: per.resourceId
  //       }
  //     }
  //   });
  // }
  // await MongoResourcePermission.bulkWrite(resourcePermissionOps, { session, ordered: true });

  // for (const org of latestOrgList) {
  //   // 3.1 create new orgs
  //   // const [newOrg] = await MongoOrgModel.create(
  //   //   [
  //   //     {
  //   //       teamId,
  //   //       name: org.name,
  //   //       pathId: org.pathId,
  //   //       path: org.path
  //   //     }
  //   //   ],
  //   //   { session, ordered: true }
  //   // );
  //   // 3.2 add members
  //   // for (const tmbId of org.tmbIds) {
  //   //   await MongoOrgMemberModel.create(
  //   //     [
  //   //       {
  //   //         teamId,
  //   //         orgId: newOrg._id,
  //   //         tmbId
  //   //       }
  //   //     ],
  //   //     { session, ordered: true }
  //   //   );
  //   // }
  //   // const pers = permissions.filter((p) => {
  //   //   if (!p.orgId) return;
  //   //   const oldOrgId = pathId_oldOrgMap.get(String(org.pathId));
  //   //   if (String(p.orgId) === String(oldOrgId)) {
  //   //     return true;
  //   //   }
  //   //   return false;
  //   // });
  //   // 3.3 add resource Permissions
  //   // await MongoResourcePermission.create(
  //   //   pers.map((per) => ({
  //   //     teamId,
  //   //     orgId: newOrg._id,
  //   //     permission: per.permission,
  //   //     resourceType: per.resourceType,
  //   //     resourceId: per.resourceId
  //   //   })),
  //   //   { session, ordered: true }
  //   // );
  // }

  addLog.debug(`syncOrg: end`);
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
  // Transfer source
  const func = async (session: ClientSession) => {
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
    await MongoGroupMemberModel.deleteMany(
      {
        tmbId: memberTmbId
      },
      { session }
    );
    // Delete org member
    await MongoOrgMemberModel.deleteMany(
      {
        teamId,
        tmbId: memberTmbId
      },
      { session }
    );

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
    removeTmb.status =
      global.systemConfig.teamMode === TeamModeEnum.sync
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
