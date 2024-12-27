import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import type {
  CreateTeamProps,
  UpdateTeamProps
} from '@fastgpt/global/support/user/team/controller.d';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum,
  notLeaveStatus
} from '@fastgpt/global/support/user/team/constant';
import {
  TeamTmbItemType,
  TeamMemberItemType,
  TeamMemberSchema
} from '@fastgpt/global/support/user/team/type';
import type { TeamMemberWithTeamAndUserSchema } from '@fastgpt/global/support/user/team/type.d';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { MongoOpenApi } from '@fastgpt/service/support/openapi/schema';
import { MongoOutLink } from '@fastgpt/service/support/outLink/schema';
import { ClientSession } from '@fastgpt/service/common/mongo';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { initTeamFreePlan } from '@fastgpt/service/support/wallet/sub/utils';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { TeamDefaultPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { getGroupPer, getResourcePermission } from '@fastgpt/service/support/permission/controller';
import { LOGO_ICON } from '@fastgpt/global/common/system/constants';

import { getGroupsByTeamId } from './group/controller';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { DefaultGroupName } from '@fastgpt/global/support/user/team/group/constant';
import { getGroupsByTmbId } from '@fastgpt/service/support/permission/memberGroup/controllers';
import { GroupMemberRole } from '@fastgpt/global/support/permission/memberGroup/constant';
import { UserModelSchema } from '@fastgpt/global/support/user/type';
import { TeamSchema } from '@fastgpt/global/support/user/team/type';

/* -------- format --------- */
export async function teamMemberSchema2TeamItemType(
  data: TeamMemberWithTeamAndUserSchema
): Promise<TeamTmbItemType> {
  const per = await getResourcePermission({
    resourceType: PerResourceTypeEnum.team,
    teamId: data.teamId,
    tmbId: data._id
  });

  return {
    userId: String(data.userId),
    teamId: String(data.teamId),
    teamName: data.team.name,
    memberName: data.name,
    avatar: data.team.avatar,
    balance: data.team.balance,
    tmbId: String(data._id),
    teamDomain: data.team.teamDomain,
    role: data.role,
    status: data.status,
    defaultTeam: data.defaultTeam,
    permission: new TeamPermission({
      per: per ?? TeamDefaultPermissionVal,
      isOwner: data.role === TeamMemberRoleEnum.owner
    }),
    notificationAccount: data.team.notificationAccount,

    lafAccount: data.team.lafAccount,
    openaiAccount: data.team.openaiAccount,
    externalWorkflowVariables: data.team.externalWorkflowVariables
  };
}

/* -------------- team ------------ */
/** create team, as well as tmb and default group
 * @param{Object} obj
 * @param{string} obj.ownerId
 * @param{string} obj.notificationAccount
 * @param{string} obj.name
 * @param{string} obj.avatar
 * @param{boolean} obj.defaultTeam
 * @param{ClientSession} obj.session
 * @throws{Error} if ownerId or name is not exist
 */
export async function createTeam({
  ownerId,
  notificationAccount,
  name,
  memberName = 'Owner',
  avatar,
  defaultTeam = false,
  session
}: CreateTeamProps & {
  ownerId: string;
  notificationAccount?: string;
  session: ClientSession;
}): Promise<TeamTmbItemType> {
  try {
    // create team
    const [team] = await MongoTeam.create(
      [
        {
          ownerId,
          name,
          avatar,
          notificationAccount,
          defaultPermission: TeamDefaultPermissionVal
        }
      ],
      { session }
    );
    // create team member
    const [tmb] = await MongoTeamMember.create(
      [
        {
          teamId: team._id,
          userId: ownerId,
          name: memberName,
          role: TeamMemberRoleEnum.owner,
          status: TeamMemberStatusEnum.active,
          defaultTeam
        }
      ],
      { session }
    );

    await MongoMemberGroupModel.create(
      [
        {
          teamId: team._id,
          name: DefaultGroupName,
          avatar: team.avatar
        }
      ],
      { session }
    );

    // create sub plan
    await initTeamFreePlan({
      teamId: team._id,
      session
    });

    return {
      userId: String(ownerId),
      teamId: String(team._id),
      teamName: team.name,
      memberName: tmb.name,
      avatar: team.avatar,
      balance: team.balance,
      tmbId: String(tmb._id),
      teamDomain: team.teamDomain,
      role: tmb.role,
      status: tmb.status,
      defaultTeam: tmb.defaultTeam,
      permission: new TeamPermission({
        isOwner: true
      })
    };
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function updateTeam({
  teamId,
  name,
  avatar,
  teamDomain,
  lafAccount
}: UpdateTeamProps & { teamId: string }) {
  await MongoTeam.findByIdAndUpdate(teamId, {
    name,
    avatar,
    teamDomain,
    lafAccount
  });
}

export async function getUserTeams(data: {
  userId?: string;
  tmbId?: string;
  status?: TeamMemberSchema['status'];
  role?: TeamMemberSchema['role'];
}): Promise<TeamTmbItemType[]> {
  if (!data.userId && !data.tmbId) {
    return Promise.reject('userId or tmbId is required');
  }
  const members = await MongoTeamMember.find(data)
    .sort({ defaultTeam: -1 })
    .populate<{
      team: TeamSchema;
      user: UserModelSchema;
    }>('team user')
    .lean();
  return Promise.all(members.map(teamMemberSchema2TeamItemType));
}

/* ----------- get team ---------- */
export async function getTeamByTmbId(tmbId: string) {
  const tmb = await MongoTeamMember.findById({
    _id: tmbId,
    status: notLeaveStatus
  })
    .populate<{ team: TeamSchema; user: UserModelSchema }>('team user')
    .lean();

  if (!tmb) {
    return Promise.reject(TeamErrEnum.unAuthTeam);
  }

  return teamMemberSchema2TeamItemType(tmb);
}

// get default team, if not exit, create one
export async function getAndCreateUserDefaultTeam({
  ownerId,
  notificationAccount,
  teamName = 'My Team',
  memberName,
  teamAvatar = LOGO_ICON,
  session
}: {
  ownerId: string;
  notificationAccount?: string;
  teamName?: string;
  teamAvatar?: string;
  memberName?: string;
  session: ClientSession;
}): Promise<TeamTmbItemType> {
  const tmb = await MongoTeamMember.findOne({
    userId: ownerId,
    defaultTeam: true
  })
    .populate<{ team: TeamSchema; user: UserModelSchema }>('team user')
    .lean();

  if (!tmb) {
    return createTeam({
      ownerId,
      name: teamName,
      avatar: teamAvatar,
      memberName,
      defaultTeam: true,
      notificationAccount,
      session
    });
  }
  return teamMemberSchema2TeamItemType(tmb);
}
// get team by tmbId, if not exit, get default team
export async function getUserTeamOrDefaultTeam(tmbId?: string, userId?: string) {
  if (tmbId) {
    return getTeamByTmbId(tmbId);
  }
  if (userId) {
    return mongoSessionRun((session) => getAndCreateUserDefaultTeam({ ownerId: userId, session }));
  }

  return Promise.reject('tmbId or userId is required');
}

/* --------------- member -------------- */
/** get the members of a team
 * @param teamId: the objectId of team
 * @return a object whose type is [TeamMemberItemType]
 * @throws {Error} if teamId is not exist
 */

export async function getTeamMembers(teamId: string): Promise<TeamMemberItemType[]> {
  const [groups, permissions, members] = await Promise.all([
    getGroupsByTeamId(teamId),
    MongoResourcePermission.find({
      teamId: teamId,
      resourceType: PerResourceTypeEnum.team
    }),
    await MongoTeamMember.find({
      teamId,
      status: notLeaveStatus
    }).populate<{ user: UserModelSchema }>('user')
  ]);

  return members.map((member) => {
    const isOwner = member.role === TeamMemberRoleEnum.owner;

    const groupPermission = groups
      .filter((g) => g.members.includes(String(member._id)))
      .map((g) => g.permission)
      .filter((p) => p !== undefined);

    const groupPer = getGroupPer(groupPermission);

    const per =
      permissions.find((p) => String(p.tmbId) === String(member._id))?.permission ??
      groupPer ??
      TeamDefaultPermissionVal;

    return {
      userId: member.userId,
      tmbId: member._id,
      teamId: member.teamId,
      memberName: member.name,
      avatar: member.user.avatar,
      role: member.role,
      status: member.status,
      permission: new TeamPermission({
        per,
        isOwner
      })
    };
  });
}

// get the member of a team
// @param tmbId: the objectId of team member
// @return a object whose type is [TeamMemberItemType]
export async function getTeamMember({
  teamId,
  tmbId
}: {
  teamId: string;
  tmbId: string;
}): Promise<TeamMemberItemType> {
  const [member, team, per] = await Promise.all([
    MongoTeamMember.findOne({
      teamId,
      _id: tmbId
    }).populate<{ user: UserModelSchema }>('user'),
    MongoTeam.findById(teamId),
    getResourcePermission({
      resourceType: PerResourceTypeEnum.team,
      teamId,
      tmbId
    })
  ]);

  if (!member) {
    return Promise.reject('member not exist');
  }

  if (!team) {
    return Promise.reject('team not exist');
  }

  return {
    userId: member.userId,
    tmbId: member._id,
    teamId: member.teamId,
    memberName: member.name,
    avatar: member.user.avatar,
    role: member.role,
    status: member.status,
    permission: new TeamPermission({
      per: per ?? TeamDefaultPermissionVal,
      isOwner: member.role === TeamMemberRoleEnum.owner
    })
  };
}
/** remove user from team
 * @param{Object} obj
 * @param{string} obj.teamId
 * @param{string} obj.memberId
 * @throws{Error} if teamId or memberId is not exist
 */
export async function removeUser({ teamId, memberId }: { teamId: string; memberId: string }) {
  const tmb = await MongoTeamMember.findOne({
    teamId,
    _id: memberId
  });
  if (!tmb) {
    return Promise.reject('member not exist');
  }

  const ownerTmb = await MongoTeamMember.findOne({
    teamId: tmb.teamId,
    role: TeamMemberRoleEnum.owner
  });
  if (!ownerTmb) {
    return Promise.reject('owner not exist');
  }

  const memberTmbId = String(memberId);
  const teamOwnerTmbId = String(ownerTmb._id);

  // update shareLink and openapi tmbId
  await mongoSessionRun(async (session) => {
    await MongoOpenApi.updateMany(
      {
        tmbId: memberTmbId
      },
      {
        tmbId: teamOwnerTmbId
      },
      { session }
    );
    await MongoOutLink.updateMany(
      {
        tmbId: memberTmbId
      },
      {
        tmbId: teamOwnerTmbId
      },
      { session }
    );

    // delete permission
    await MongoResourcePermission.deleteMany(
      {
        resourceType: { $exists: true },
        teamId,
        tmbId: memberTmbId
      },
      { session }
    );

    await MongoGroupMemberModel.deleteMany(
      {
        tmbId: memberTmbId
      },
      { session }
    );

    // update status is leave
    await MongoTeamMember.findOneAndUpdate(
      {
        _id: memberTmbId,
        teamId: tmb.teamId,
        role: { $ne: TeamMemberRoleEnum.owner }
      },
      {
        status: TeamMemberStatusEnum.leave
      },
      { session }
    );

    // Transfer group to team owner
    const groups = await getGroupsByTmbId({
      tmbId: memberTmbId,
      teamId: tmb.teamId,
      role: [GroupMemberRole.owner]
    });

    // delete group member
    await MongoGroupMemberModel.deleteMany(
      {
        tmbId: memberTmbId
      },
      { session }
    );

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
  });
}

/* ----------------- auth ----------------- */

// tmbId exist or userId and teamId has tmb data
export async function authUserExistTeam({ userId, teamId }: { userId?: string; teamId?: string }) {
  if (userId && teamId) {
    return MongoTeamMember.findOne({ userId, teamId, status: { $ne: TeamMemberStatusEnum.leave } });
  }
  return null;
}
