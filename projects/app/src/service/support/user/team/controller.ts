import { MongoTeam } from './teamSchema';
import { MongoTeamMember } from './teamMemberSchema';
import type {
  AuthTeamRoleProps,
  CreateTeamProps,
  UpdateTeamProps
} from '@fastgpt/global/support/user/team/controller.d';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum,
  leaveStatus
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
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/bill/constants';

/* -------- format --------- */
export function teamMemberSchema2TeamItemType(data: TeamMemberSchemaWithTeamAndUser): TeamItemType {
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
  defaultTeam = false
}: CreateTeamProps & { ownerId: string }) {
  let id = '';
  try {
    const { _id } = await MongoTeam.create({
      ownerId,
      name,
      avatar,
      maxSize: global.systemConfig.system?.teamDefaultMaxMember || 5,
      balance: (global.systemConfig.system?.userDefaultBalance || 2) * PRICE_SCALE
    });
    id = _id;
    await MongoTeamMember.create({
      teamId: _id,
      userId: ownerId,
      name: 'Owner',
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
export async function getTeamByTmbId(tmbId: string) {
  const tmb = (await MongoTeamMember.findById({
    _id: tmbId,
    status: leaveStatus
  }).populate('teamId userId')) as TeamMemberSchemaWithTeamAndUser;

  if (!tmb) {
    return Promise.reject(TeamErrEnum.unAuthTeam);
  }

  return teamMemberSchema2TeamItemType(tmb);
}
// get default team, if not exit, create one
export async function getUserDefaultTeam(userId: string): Promise<TeamItemType> {
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
export async function getUserTeamOrDefaultTeam(tmbId?: string, userId?: string) {
  if (tmbId) {
    return getTeamByTmbId(tmbId);
  }
  if (userId) {
    return getUserDefaultTeam(userId);
  }

  return Promise.reject('tmbId or userId is required');
}

/* --------------- member -------------- */
export async function getTeamMembers(teamId: string): Promise<TeamMemberItemType[]> {
  const members = (await MongoTeamMember.find({
    teamId,
    status: leaveStatus
  }).populate('userId')) as TeamMemberSchemaWithUser[];
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
    }).populate('teamId userId')) as TeamMemberSchemaWithTeamAndUser;
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
    MongoTeamMember.countDocuments({ teamId, status: leaveStatus })
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
