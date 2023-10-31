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
  TeamMemberSchemaWithTeam,
  TeamMemberSchemaWithUser
} from '@fastgpt/global/support/user/team/type';
import { ERROR_ENUM } from '@fastgpt/global/common/error/errorCode';

/* ----------------- auth ----------------- */
export async function authTeamRole({ userId, teamId, role }: AuthTeamRoleProps) {
  try {
    if (!userId || !teamId) {
      return Promise.reject(ERROR_ENUM.unAuthTeam);
    }
    console.log(userId, teamId);

    const teamMember = await MongoTeamMember.findOne({ userId, teamId, ...(role && { role }) });
    if (!teamMember) {
      return Promise.reject(ERROR_ENUM.unAuthTeam);
    }
    return teamMember;
  } catch (error) {
    return Promise.reject(error);
  }
}
export async function authTeamMemberRole({ userId, teamMemberId, role }: AuthTeamRoleProps) {
  try {
    if (!userId || !teamMemberId) {
      return Promise.reject(ERROR_ENUM.unAuthTeam);
    }
    const teamMember = await MongoTeamMember.findOne({
      userId,
      teamMemberId,
      ...(role && { role })
    });
    if (!teamMember) {
      return Promise.reject(ERROR_ENUM.unAuthTeam);
    }
    return teamMember;
  } catch (error) {
    return Promise.reject(error);
  }
}

/* -------------- team ------------ */
export async function getTeamInfo(id: string) {
  return MongoTeam.findById(id);
}
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
      name: 'Owner',
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

export async function updateTeam({ id, name, avatar }: UpdateTeamProps) {
  await MongoTeam.findByIdAndUpdate(id, {
    name,
    avatar
  });
}
export async function deleteTeam(id: string) {
  await MongoTeam.findByIdAndDelete(id);
}

export async function getUserTeams(userId: string): Promise<TeamItemType[]> {
  const members = (await MongoTeamMember.find({
    userId,
    status: TeamMemberStatusEnum.active
  }).populate('teamId')) as TeamMemberSchemaWithTeam[];

  return members.map((member) => ({
    teamId: member.teamId._id,
    teamName: member.teamId.name,
    avatar: member.teamId.avatar,
    balance: member.teamId.balance,
    memberName: member.name,
    teamMemberId: member._id,
    role: member.role,
    status: member.status
  }));
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
    name: item.name,
    avatar: item.userId.avatar,
    role: item.role,
    status: item.status
  }));
}
