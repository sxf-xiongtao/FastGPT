import { MongoTeamTags } from '@fastgpt/service/support/user/team/teamTagsSchema';
import axios from 'axios';
import { TeamTagItemType } from '@fastgpt/global/support/user/team/type';
import { AuthTokenFromTeamDomainResponse } from '@fastgpt/global/support/user/team/tag';

export const loadTagsFromDomain = async (domain: string) => {
  const { data: result } = await axios.get<{ data: TeamTagItemType[] }>(`${domain}/tag/sync`);

  return result.data;
};

export const authTokenFromTeamDomain = async (domain: string, teamToken: string) => {
  const { data } = await axios.get<AuthTokenFromTeamDomainResponse>(
    `${domain}/getUserInfo?authToken=${teamToken}`
  );

  if (!data.success) {
    return Promise.reject(data.msg || data.message);
  }

  if (!data.data.uid) {
    return Promise.reject('uid null');
  }

  return data.data;
};

export const getTeamTags = async (teamId: string) => MongoTeamTags.find({ teamId });
