import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authMember } from '@/service/support/permission/team/auth';
import {
  OwnerPermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { RequireOnlyOne } from '@fastgpt/global/common/type/utils';

export type removeQuery = RequireOnlyOne<{
  tmbId?: string;
  groupId?: string;
}>;
export type removeBody = {};
export type removeResponse = {};

async function handler(
  req: ApiRequestProps<removeBody, removeQuery>,
  _res: ApiResponseType<any>
): Promise<removeResponse> {
  const { tmbId, groupId } = req.query;

  if (!tmbId && !groupId) {
    return Promise.reject('tmbId or groupId is required');
  }

  const { teamId } = await authMember({ req, authToken: true, per: OwnerPermissionVal });

  if (tmbId) {
    await MongoResourcePermission.findOneAndRemove({
      teamId,
      tmbId,
      resourceType: PerResourceTypeEnum.team
    });
  }

  if (groupId) {
    await MongoResourcePermission.findOneAndRemove({
      teamId,
      groupId,
      resourceType: PerResourceTypeEnum.team
    });
  }

  return {};
}

export default NextAPI(handler);
