import { adminCert } from '@/service/support/permission/adminCert';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { MongoPluginGroups } from '@fastgpt/service/core/app/plugin/pluginGroupSchema';
import { TGroupType } from '@fastgpt/service/core/app/plugin/type';

export type updatePluginGroupOrderQuery = {};

export type updatePluginGroupOrderBody = {
  groups: {
    groupId: string;
    groupName?: string;
    groupAvatar?: string;
    groupTypes?: TGroupType[];
    groupOrder: number;
  }[];
};

export type updatePluginGroupOrderResponse = {};

async function handler(
  req: ApiRequestProps<updatePluginGroupOrderBody, updatePluginGroupOrderQuery>,
  res: ApiResponseType<any>
): Promise<updatePluginGroupOrderResponse> {
  await adminCert({ req, authToken: true });
  const { groups } = req.body;

  await MongoPluginGroups.bulkWrite(
    groups.map((group, index) => ({
      updateOne: {
        filter: { groupId: group.groupId },
        update: { $set: { groupOrder: index } }
      }
    }))
  );

  return {};
}

export default NextAPI(handler);
