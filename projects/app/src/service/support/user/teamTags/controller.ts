import { MongoTeamTags } from '@fastgpt/service/support/user/team/teamTagsSchema';
import type { TeamTagsSchema } from '@fastgpt/global/support/user/team/type';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { updateTeamTagsUrl } from '@/service/support/user/team/controller';
/**
 *
 */
export async function getUserTeamsTags(data: { teamId: string }) {
  if (!data?.teamId) {
    return Promise.reject('teamId is required');
  }
  const tags = await MongoTeamTags.find(data);

  return tags;
}

/**
 * insert Team Tags
 */
export async function insertUserTeamsTags(data: Array<TeamTagsSchema>) {
  if (!data?.length) {
    return Promise.reject('data is empty');
  }
  const tags = await MongoTeamTags.create(data);

  return tags;
}

export async function getTeamsInfo(teamId: string) {
  if (!teamId) {
    return Promise.reject('teamId is empty');
  }
  const res = await MongoTeam.findById(teamId);

  return res;
}

export async function updateTagsUrl(data: { teamId: string; tagsUrl: string }) {
  if (!data?.teamId) {
    return Promise.reject('userId or tmbId is required');
  }
  //cupdateTeamTagsUrl(data);
  return updateTeamTagsUrl(data);
}

export async function asyncdatsByTagsUrl(data: { teamId: string; tagsUrl: string }) {
  if (!data?.teamId) {
    return Promise.reject('userId or tmbId is required');
  }
  //
  return updateTeamTagsUrl(data);
}
