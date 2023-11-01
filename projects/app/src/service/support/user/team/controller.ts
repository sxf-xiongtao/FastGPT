import { MongoTeam } from './teamSchema';
import { MongoTeamMember } from './teamMemberSchema';
import type {
  AuthTeamRoleProps,
  CreateTeamProps,
  UpdateTeamProps
} from '@fastgpt/global/support/user/team/controller.d';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';
import {
  TeamItemType,
  TeamMemberItemType,
  TeamMemberSchema
} from '@fastgpt/global/support/user/team/type';
import type {
  TeamMemberSchemaWithTeamAndUser,
  TeamMemberSchemaWithUser
} from '@/global/user/team.d';
import { ERROR_ENUM, TeamErrEnum } from '@fastgpt/global/common/error/errorCode';

/* -------- format --------- */
export function teamMemberSchema2TeamItemType(data: TeamMemberSchemaWithTeamAndUser): TeamItemType {
  return {
    teamId: String(data.teamId._id),
    teamName: data.teamId.name,
    avatar: data.teamId.avatar,
    balance: data.teamId.balance,
    teamMemberId: String(data._id),
    role: data.role,
    status: data.status,
    defaultTeam: data.defaultTeam
  };
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
      return Promise.reject(ERROR_ENUM.unAuthTeam);
    }

    const teamMember = (await MongoTeamMember.findOne({
      _id: tmbId,
      teamId,
      ...(role && { role })
    }).populate('teamId userId')) as TeamMemberSchemaWithTeamAndUser;
    if (!teamMember) {
      return Promise.reject(ERROR_ENUM.unAuthTeam);
    }
    return teamMemberSchema2TeamItemType(teamMember);
  } catch (error) {
    return Promise.reject(error);
  }
}

/* -------------- team ------------ */
export async function createTeam({
  ownerId,
  name,
  avatar,
  defaultTeam = false
}: CreateTeamProps & { ownerId: string }) {
  let id = '';
  try {
    const { _id } = await MongoTeam.create({
      ownerId,
      name,
      avatar,
      maxSize: global.systemConfig.system?.teamDefaultMaxMember || 5
    });
    id = _id;
    await MongoTeamMember.create({
      teamId: _id,
      userId: ownerId,
      role: TeamMemberRoleEnum.owner,
      status: TeamMemberStatusEnum.active,
      defaultTeam
    });
    return _id;
  } catch (error) {
    if (id) {
      await MongoTeam.findByIdAndDelete(id);
    }
    return Promise.reject(error);
  }
}
export async function updateTeam({ teamId, name, avatar }: UpdateTeamProps) {
  await MongoTeam.findByIdAndUpdate(teamId, {
    name,
    avatar
  });
}
export async function deleteTeam(teamId: string) {
  await MongoTeamMember.deleteMany({ teamId });
  await MongoTeam.findByIdAndDelete(teamId);
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
    .populate('teamId userId')) as TeamMemberSchemaWithTeamAndUser[];

  return members.map(teamMemberSchema2TeamItemType);
}

/* ----------- get team ---------- */
export async function getTmbByIdAndUId(tmbId: string, userId: string) {
  const tmb = (await MongoTeamMember.findOne({
    _id: tmbId,
    userId
  }).populate('teamId userId')) as TeamMemberSchemaWithTeamAndUser;

  if (!tmb) {
    return Promise.reject(ERROR_ENUM.unAuthTeam);
  }

  return teamMemberSchema2TeamItemType(tmb);
}
// get default team, if not exit, create one
export async function getUserDefaultTeam(userId: string) {
  const tmb = (await MongoTeamMember.findOne({
    userId,
    defaultTeam: true
  }).populate('teamId userId')) as TeamMemberSchemaWithTeamAndUser;
  if (!tmb) {
    await createTeam({
      ownerId: userId,
      name: 'My Team',
      avatar: '/icon/logo.svg',
      defaultTeam: true
    });
    return getUserDefaultTeam(userId);
  }
  return teamMemberSchema2TeamItemType(tmb);
}
// get team by tmbId, if not exit, get default team
export async function getUserTeamOrDefaultTeam(userId: string, tmbId?: string) {
  try {
    if (!tmbId) {
      return getUserDefaultTeam(userId);
    }
    const tmb = await getTmbByIdAndUId(tmbId, userId);
    return tmb;
  } catch (error) {
    return getUserDefaultTeam(userId);
  }
}

/* --------------- member -------------- */
export async function getTeamMembers(teamId: string): Promise<TeamMemberItemType[]> {
  const members = (await MongoTeamMember.find({ teamId }).populate(
    'userId'
  )) as TeamMemberSchemaWithUser[];
  return members.map((item) => ({
    userId: item.userId._id,
    teamMemberId: item._id,
    teamId: item.teamId,
    memberUsername: item.userId.username,
    avatar: item.userId.avatar,
    role: item.role,
    status: item.status
  }));
}

export async function authTeamMaxMember(teamId: string) {
  const [team, members] = await Promise.all([
    MongoTeam.findById(teamId, 'maxSize'),
    MongoTeamMember.countDocuments({ teamId })
  ]);
  if (!team) {
    return Promise.reject('Team not exit');
  }
  if (members >= team.maxSize) {
    return Promise.reject(TeamErrEnum.teamOverSize);
  }
  return {
    maxSize: team.maxSize,
    memberAmount: members
  };
}

// tmbId exist or userId and teamId has tmb data
export async function authMemberExistTeam({
  tmbId,
  userId,
  teamId
}: {
  tmbId?: string;
  userId?: string;
  teamId?: string;
}) {
  if (tmbId) {
    return MongoTeamMember.findOne({ _id: tmbId });
  }
  if (userId && teamId) {
    return MongoTeamMember.findOne({ userId, teamId });
  }
  return null;
}
