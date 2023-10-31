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
import { TeamItemType, TeamMemberItemType } from '@fastgpt/global/support/user/team/type';
import type {
  TeamMemberSchemaWithTeamAndUser,
  TeamMemberSchemaWithUser
} from '@/global/user/team.d';
import { ERROR_ENUM } from '@fastgpt/global/common/error/errorCode';

/* ----------------- auth ----------------- */
export async function authTeamRole({
  userId,
  tmbId,
  role
}: AuthTeamRoleProps): Promise<TeamItemType> {
  try {
    if (!userId || !tmbId) {
      return Promise.reject(ERROR_ENUM.unAuthTeam);
    }

    const teamMember = (await MongoTeamMember.findOne({
      _id: tmbId,
      userId,
      ...(role && { role })
    }).populate('teamId userId')) as TeamMemberSchemaWithTeamAndUser;
    if (!teamMember) {
      return Promise.reject(ERROR_ENUM.unAuthTeam);
    }
    return {
      teamId: String(teamMember.teamId._id),
      teamName: teamMember.teamId.name,
      avatar: teamMember.teamId.avatar,
      balance: teamMember.teamId.balance,
      teamMemberId: String(teamMember._id),
      role: teamMember.role,
      status: teamMember.status
    };
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

export async function getUserTeams(userId: string): Promise<TeamItemType[]> {
  const members = (await MongoTeamMember.find({
    userId,
    status: TeamMemberStatusEnum.active
  }).populate('teamId userId')) as TeamMemberSchemaWithTeamAndUser[];

  return members.map((member) => ({
    teamId: member.teamId._id,
    teamName: member.teamId.name,
    avatar: member.teamId.avatar,
    balance: member.teamId.balance,
    memberName: member.userId,
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
    memberUsername: item.userId.username,
    avatar: item.userId.avatar,
    role: item.role,
    status: item.status
  }));
}
