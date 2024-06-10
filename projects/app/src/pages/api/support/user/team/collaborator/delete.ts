import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authMember } from '@/service/support/permission/team/auth';
import {
  OwnerPermissionVal,
  PerResourceTypeEnum
} from '@fastgpt/global/support/permission/constant';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';

export type removeQuery = {
  tmbId: string;
};

export type removeBody = {};

export type removeResponse = {};

async function handler(
  req: ApiRequestProps<removeBody, removeQuery>,
  res: ApiResponseType<any>
): Promise<removeResponse> {
  const { tmbId } = req.query;

  if (!tmbId) {
    return Promise.reject('tmbId is required');
  }

  const { teamId } = await authMember({ req, authToken: true, per: OwnerPermissionVal });

  const delRes = await MongoResourcePermission.findOneAndRemove({
    teamId,
    tmbId,
    resourceType: PerResourceTypeEnum.team
  });
  console.log(
    {
      teamId,
      tmbId,
      resourceType: PerResourceTypeEnum.team
    },
    delRes
  );
  return {};
}

export default NextAPI(handler);
