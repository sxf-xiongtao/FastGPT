import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoPluginGroups } from '@fastgpt/service/core/app/plugin/pluginGroupSchema';
import { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { nanoid } from 'nanoid';

export type createPluginGroupQuery = {};

export type createPluginGroupBody = {
  groupName: string;
  groupAvatar: string;
  groupOrder: number;
};

export type createPluginGroupResponse = {};

async function handler(
  req: ApiRequestProps<createPluginGroupBody, createPluginGroupQuery>,
  res: ApiResponseType<any>
): Promise<createPluginGroupResponse> {
  await adminCert({ req, authToken: true });
  const { groupName, groupAvatar, groupOrder } = req.body;

  await MongoPluginGroups.create({
    groupId: nanoid(),
    groupName,
    groupAvatar,
    groupTypes: [],
    groupOrder
  });

  return {};
}

export default NextAPI(handler);
