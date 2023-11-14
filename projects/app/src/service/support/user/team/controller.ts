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
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/bill/constants';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { MongoBill } from '@fastgpt/service/support/wallet/bill/schema';
import { MongoChatItem } from '@fastgpt/service/core/chat/chatItemSchema';
import { MongoChat } from '@fastgpt/service/core/chat/chatSchema';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { MongoDatasetCollection } from '@fastgpt/service/core/dataset/collection/schema';
import { MongoDatasetData } from '@fastgpt/service/core/dataset/data/schema';
import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import { getGFSCollection } from '@fastgpt/service/common/file/gridfs/controller';
import { MongoOpenApi } from '@fastgpt/service/support/openapi/schema';
import { MongoOutLink } from '@fastgpt/service/support/outLink/schema';
import { MongoPay } from '../../wallet/pay/schema';
import { MongoPlugin } from '@fastgpt/service/core/plugin/schema';
import { PgClient } from '@fastgpt/service/common/pg';
import { PgDatasetTableName } from '@fastgpt/global/core/dataset/constant';

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
export async function getTeamByTmbId(tmbId: string) {
  const tmb = (await MongoTeamMember.findById(tmbId).populate(
    'teamId userId'
  )) as TeamMemberSchemaWithTeamAndUser;

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
  const members = (await MongoTeamMember.find({ teamId }).populate(
    'userId'
  )) as TeamMemberSchemaWithUser[];
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
// delete one member, update it all source to owner
export async function deleteOneMember(tmbId: string) {
  const tmb = await MongoTeamMember.findById(tmbId);
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
  tmbId = String(tmbId);
  const ownerId = String(ownerTmb._id);

  // transfer all resources:
  await Promise.all([
    MongoApp.updateMany({ tmbId }, { tmbId: ownerId }),
    MongoOpenApi.updateMany({ tmbId }, { tmbId: ownerId }),
    MongoOutLink.updateMany({ tmbId }, { tmbId: ownerId }),
    MongoPay.updateMany({ tmbId }, { tmbId: ownerId }),
    MongoPlugin.updateMany({ tmbId }, { tmbId: ownerId })
  ]);

  await Promise.all([
    MongoBill.updateMany({ tmbId }, { tmbId: ownerId }),
    MongoChatItem.updateMany({ tmbId }, { tmbId: ownerId }),
    MongoChat.updateMany({ tmbId }, { tmbId: ownerId })
  ]);

  await Promise.all([
    MongoDataset.updateMany({ tmbId }, { tmbId: ownerId }),
    MongoDatasetCollection.updateMany({ tmbId }, { tmbId: ownerId }),
    MongoDatasetData.updateMany({ tmbId }, { tmbId: ownerId }),
    MongoDatasetTraining.updateMany({ tmbId }, { tmbId: ownerId }),
    getGFSCollection('dataset').updateMany(
      { 'metadata.tmbId': tmbId },
      {
        $set: {
          'metadata.tmbId': ownerId
        }
      }
    )
  ]);
  // pg
  try {
    pgClient?.query(
      `UPDATE ${PgDatasetTableName} SET "tmbId"='${ownerId}' WHERE "tmbId"='${tmbId}'`
    );
  } catch (error) {}

  await MongoTeamMember.findByIdAndDelete(tmbId);
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
