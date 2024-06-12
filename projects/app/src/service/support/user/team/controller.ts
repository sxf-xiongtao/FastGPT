import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import type {
  AuthTeamRoleProps,
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
import type {
  TeamMemberWithTeamAndUserSchema,
  TeamMemberWithUserSchema
} from '@fastgpt/global/support/user/team/type.d';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { MongoOpenApi } from '@fastgpt/service/support/openapi/schema';
import { MongoOutLink } from '@fastgpt/service/support/outLink/schema';
import { ClientSession } from '@fastgpt/service/common/mongo';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { initTeamStandardPlan2Free } from '@fastgpt/service/support/wallet/sub/utils';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { TeamDefaultPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { getResourcePermission } from '@fastgpt/service/support/permission/controller';

/* -------- format --------- */
export async function teamMemberSchema2TeamItemType(
  data: TeamMemberWithTeamAndUserSchema
): Promise<TeamTmbItemType> {
  const per = await getResourcePermission({
    resourceType: PerResourceTypeEnum.team,
    teamId: data.teamId._id,
    tmbId: data._id
  });
  return {
    userId: String(data.userId._id),
    teamId: String(data.teamId._id),
    teamName: data.teamId.name,
    memberName: data.name,
    avatar: data.teamId.avatar,
    balance: data.teamId.balance,
    tmbId: String(data._id),
    teamDomain: data.teamId.teamDomain,
    role: data.role,
    status: data.status,
    defaultTeam: data.defaultTeam,
    lafAccount: data.teamId.lafAccount,
    permission: new TeamPermission({
      per: per?.permission ?? data.teamId.defaultPermission ?? TeamDefaultPermissionVal,
      isOwner: data.role === TeamMemberRoleEnum.owner
    })
  };
}

/* -------------- team ------------ */
export async function createTeam({
  ownerId,
  name,
  avatar,
  defaultTeam = false,
  session
}: CreateTeamProps & { ownerId: string; session?: ClientSession }): Promise<TeamTmbItemType> {
  try {
    const [team] = await MongoTeam.create(
      [
        {
          ownerId,
          name,
          avatar,
          defaultPermission: TeamDefaultPermissionVal
        }
      ],
      { session }
    );

    const [tmb] = await MongoTeamMember.create(
      [
        {
          teamId: team._id,
          userId: ownerId,
          name: 'Owner',
          role: TeamMemberRoleEnum.owner,
          status: TeamMemberStatusEnum.active,
          defaultTeam
        }
      ],
      { session }
    );

    // create sub plan
    await initTeamStandardPlan2Free({
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
        per: team.defaultPermission,
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
  const members = (await MongoTeamMember.find(data)
    .sort({ defaultTeam: -1 })
    .populate('teamId userId')) as TeamMemberWithTeamAndUserSchema[];
  return await Promise.all(members.map(teamMemberSchema2TeamItemType));
}

/* ----------- get team ---------- */
export async function getTeamByTmbId(tmbId: string) {
  const tmb = (await MongoTeamMember.findById({
    _id: tmbId,
    status: notLeaveStatus
  }).populate('teamId userId')) as TeamMemberWithTeamAndUserSchema;

  if (!tmb) {
    return Promise.reject(TeamErrEnum.unAuthTeam);
  }

  return teamMemberSchema2TeamItemType(tmb);
}

// get default team, if not exit, create one
export async function getAndCreateUserDefaultTeam(
  userId: string,
  session?: ClientSession
): Promise<TeamTmbItemType> {
  const tmb = (await MongoTeamMember.findOne({
    userId,
    defaultTeam: true
  }).populate('teamId userId')) as TeamMemberWithTeamAndUserSchema;

  if (!tmb) {
    return createTeam({
      ownerId: userId,
      name: 'My Team',
      avatar: '/icon/logo.svg',
      defaultTeam: true,
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
    return mongoSessionRun((session) => getAndCreateUserDefaultTeam(userId, session));
  }

  return Promise.reject('tmbId or userId is required');
}

/* --------------- member -------------- */
// get the members of a team
// @param teamId: the objectId of team
// @return a object whose type is [TeamMemberItemType]
export async function getTeamMembers(teamId: string): Promise<TeamMemberItemType[]> {
  const [team, permissions, members] = await Promise.all([
    MongoTeam.findById(teamId),
    MongoResourcePermission.find({
      teamId: teamId,
      resourceType: PerResourceTypeEnum.team
    }),
    (await MongoTeamMember.find({
      teamId,
      status: notLeaveStatus
    }).populate('userId')) as TeamMemberWithUserSchema[]
  ]);

  return members.map((member) => {
    const isOwner = member.role === TeamMemberRoleEnum.owner;
    const per =
      permissions.find((p) => String(p.tmbId) === String(member._id))?.permission ??
      team?.defaultPermission ??
      TeamDefaultPermissionVal;

    return {
      userId: member.userId._id,
      tmbId: member._id,
      teamId: member.teamId,
      memberName: member.name,
      avatar: member.userId.avatar,
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
  const member = (await MongoTeamMember.findOne({
    teamId,
    _id: tmbId
  }).populate('userId')) as TeamMemberWithUserSchema;

  if (!member) {
    return Promise.reject('member not exist');
  }

  const team = await MongoTeam.findById(member.teamId);

  if (!team) {
    return Promise.reject('team not exist');
  }

  const per = await getResourcePermission({
    resourceType: PerResourceTypeEnum.team,
    teamId: member.teamId,
    tmbId: member._id
  });

  return {
    userId: member.userId._id,
    tmbId: member._id,
    teamId: member.teamId,
    memberName: member.name,
    avatar: member.userId.avatar,
    role: member.role,
    status: member.status,
    permission: new TeamPermission({
      per: per?.permission ?? team.defaultPermission ?? TeamDefaultPermissionVal,
      isOwner: member.role === TeamMemberRoleEnum.owner
    })
  };
}

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
    await MongoResourcePermission.deleteMany({
      resourceType: { $exists: true },
      teamId,
      tmbId: memberTmbId
    });

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
