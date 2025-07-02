import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoPluginGroups } from '@fastgpt/service/core/app/plugin/pluginGroupSchema';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { nanoid } from 'nanoid';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';

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
  const authResult = await adminCert({ req, authToken: true });
  const userDetail = await getUserDetail({ tmbId: authResult.tmbId });
  const { groupName, groupAvatar, groupOrder } = req.body;

  await MongoPluginGroups.create({
    groupId: nanoid(),
    groupName,
    groupAvatar,
    groupTypes: [],
    groupOrder
  });

  (async () => {
    addAuditLog({
      tmbId: authResult.tmbId,
      teamId: userDetail.team.teamId,
      event: AdminAuditEventEnum.ADMIN_CREATE_PLUGIN_GROUP,
      params: {
        name: groupName,
        groupName: groupName
      }
    });
  })();

  return {};
}

export default NextAPI(handler);
