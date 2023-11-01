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
import { ERROR_ENUM } from '@fastgpt/global/common/error/errorCode';

/* -------- format --------- */
export function teamMemberSchema2TeamItemType(data: TeamMemberSchemaWithTeamAndUser) {
  return {
    teamId: String(data.teamId._id),
    teamName: data.teamId.name,
    avatar: data.teamId.avatar,
    balance: data.teamId.balance,
    teamMemberId: String(data._id),
    role: data.role,
    status: data.status
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
export async function createTeam({ ownerId, name, avatar }: CreateTeamProps & { ownerId: string }) {
  let id = '';
  try {
    const { _id } = await MongoTeam.create({
      ownerId,
      name,
      avatar
    });
    id = _id;
    await MongoTeamMember.create({
      teamId: _id,
      userId: ownerId,
      role: TeamMemberRoleEnum.owner,
      status: TeamMemberStatusEnum.active
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
  const members = (await MongoTeamMember.find(data).populate(
    'teamId userId'
  )) as TeamMemberSchemaWithTeamAndUser[];

  return members.map(teamMemberSchema2TeamItemType);
}
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
