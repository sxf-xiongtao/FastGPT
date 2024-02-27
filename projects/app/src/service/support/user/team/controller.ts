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
  TeamItemType,
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
import { initTeamSubPlan2Free } from '../../wallet/sub/utils';

/* -------- format --------- */
export function teamMemberSchema2TeamItemType(data: TeamMemberWithTeamAndUserSchema): TeamItemType {
  return {
    userId: String(data.userId._id),
    teamId: String(data.teamId._id),
    teamName: data.teamId.name,
    memberName: data.name,
    avatar: data.teamId.avatar,
    balance: data.teamId.balance,
    tmbId: String(data._id),
    role: data.role,
    status: data.status,
    defaultTeam: data.defaultTeam,
    canWrite: data.role !== TeamMemberRoleEnum.visitor,
    maxSize: data.teamId.maxSize
  };
}

/* -------------- team ------------ */
export async function createTeam({
  ownerId,
  name,
  avatar,
  defaultTeam = false,
  session
}: CreateTeamProps & { ownerId: string; session?: ClientSession }) {
  try {
    const [team] = await MongoTeam.create(
      [
        {
          ownerId,
          name,
          avatar
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
    await initTeamSubPlan2Free({
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
      role: tmb.role,
      status: tmb.status,
      defaultTeam: tmb.defaultTeam,
      canWrite: tmb.role !== TeamMemberRoleEnum.visitor,
      maxSize: team.maxSize
    };
  } catch (error) {
    return Promise.reject(error);
  }
}
export async function updateTeam({ teamId, name, avatar }: UpdateTeamProps) {
  await MongoTeam.findByIdAndUpdate(teamId, {
    name,
    avatar
  });
}
export async function updateTeamTagsUrl({ teamId, tagsUrl }: { teamId: string; tagsUrl: string }) {
  await MongoTeam.findByIdAndUpdate(teamId, {
    tagsUrl
  });
}
export async function getUserTeams(data: {
  userId?: string;
  tmbId?: string;
  status?: TeamMemberSchema['status'];
  role?: TeamMemberSchema['role'];
}): Promise<TeamItemType[]> {
  if (!data.userId && !data.tmbId) {
    return Promise.reject('userId or tmbId is required');
  }
  const members = (await MongoTeamMember.find(data)
    .sort({ defaultTeam: -1 })
    .populate('teamId userId')) as TeamMemberWithTeamAndUserSchema[];

  return members.map(teamMemberSchema2TeamItemType);
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
): Promise<TeamItemType> {
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
export async function getTeamMembers(teamId: string): Promise<TeamMemberItemType[]> {
  const members = (await MongoTeamMember.find({
    teamId,
    status: notLeaveStatus
  }).populate('userId')) as TeamMemberWithUserSchema[];
  return members.map((item) => ({
    userId: item.userId._id,
    tmbId: item._id,
    teamId: item.teamId,
    memberName: item.name,
    avatar: item.userId.avatar,
    role: item.role,
    status: item.status
  }));
}
export async function removeUser(memberId: string) {
  const tmb = await MongoTeamMember.findById(memberId);
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
  await Promise.all([
    MongoOpenApi.updateMany(
      {
        tmbId: memberTmbId
      },
      {
        tmbId: teamOwnerTmbId
      }
    ),
    MongoOutLink.updateMany(
      {
        tmbId: memberTmbId
      },
      {
        tmbId: teamOwnerTmbId
      }
    )
  ]);

  // update status is leave
  await MongoTeamMember.findOneAndUpdate(
    {
      _id: memberTmbId,
      teamId: tmb.teamId,
      role: { $ne: TeamMemberRoleEnum.owner }
    },
    {
      status: TeamMemberStatusEnum.leave
    }
  );
}

/* ----------------- auth ----------------- */
/* auth teamMember in team role */
export async function authTeamRole({
  teamId,
  tmbId,
  role
}: AuthTeamRoleProps): Promise<TeamItemType> {
  try {
    if (!teamId || !tmbId) {
      return Promise.reject(TeamErrEnum.unAuthTeam);
    }

    const teamMember = (await MongoTeamMember.findOne({
      _id: tmbId,
      teamId,
      ...(role && { role })
    }).populate('teamId userId')) as TeamMemberWithTeamAndUserSchema;
    if (!teamMember) {
      return Promise.reject(TeamErrEnum.unAuthTeam);
    }
    return teamMemberSchema2TeamItemType(teamMember);
  } catch (error) {
    return Promise.reject(error);
  }
}
// auth max member, if  over, reject
export async function authTeamMaxMember(teamId: string, addAmount: number) {
  const [team, members] = await Promise.all([
    MongoTeam.findById(teamId, 'maxSize'),
    MongoTeamMember.countDocuments({ teamId, status: notLeaveStatus })
  ]);
  if (!team) {
    return Promise.reject('Team not exit');
  }
  if (members + addAmount >= team.maxSize) {
    return Promise.reject(TeamErrEnum.teamOverSize);
  }
}
// tmbId exist or userId and teamId has tmb data
export async function authUserExistTeam({ userId, teamId }: { userId?: string; teamId?: string }) {
  if (userId && teamId) {
    return MongoTeamMember.findOne({ userId, teamId, status: { $ne: TeamMemberStatusEnum.leave } });
  }
  return null;
}
