// // Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';
import { addDays } from 'date-fns';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import type { PaginationProps, PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { parsePaginationRequest } from '@fastgpt/service/common/api/pagination';
import type { UsageItemType } from '@fastgpt/global/support/wallet/usage/type';
import type { GetUsageProps } from '@fastgpt/global/support/wallet/usage/api';
import { replaceRegChars } from '@fastgpt/global/common/string/tools';
import { addSourceMember } from '@fastgpt/service/support/user/utils';

export type GetUsageQuery = {};
export type GetUsageBody = PaginationProps<GetUsageProps>;
export type GetUsageResponse = PaginationResponse<UsageItemType>;

async function handler(
  req: ApiRequestProps<GetUsageBody, GetUsageQuery>,
  _res: ApiResponseType<any>
): Promise<GetUsageResponse> {
  const {
    dateStart = addDays(new Date(), -7),
    dateEnd = new Date(),
    sources,
    teamMemberIds,
    projectName
  } = req.body;

  const { offset, pageSize } = parsePaginationRequest(req);

  const { teamId, tmbId, permission } = await authUserPer({
    req,
    authToken: true,
    per: ReadPermissionVal
  });

  const where = {
    teamId,
    // 非管理员只能看自己。管理员可以看所有人或者指定人。
    ...(permission.hasManagePer
      ? teamMemberIds
        ? {
            tmbId: { $in: teamMemberIds }
          }
        : { tmbId: { $exists: true } }
      : { tmbId }),
    source: sources ? { $in: sources } : { $exists: true },
    time: {
      $gte: new Date(dateStart),
      $lte: new Date(dateEnd)
    },
    ...(projectName && { appName: { $regex: new RegExp(`${replaceRegChars(projectName)}`, 'i') } })
  };

  // get bill record and total by record
  const [usages, total] = await Promise.all([
    MongoUsage.find(where, undefined, {
      ...readFromSecondary
    })
      .sort({ _id: -1 })
      .skip(offset)
      .limit(pageSize)
      .lean(),
    MongoUsage.countDocuments(where, {
      ...readFromSecondary
    })
  ]);

  const usagesWithMember = await addSourceMember({
    list: usages
  });

  return {
    list: usagesWithMember.map((usage) => {
      return {
        id: usage._id,
        source: usage.source,
        time: usage.time,
        totalPoints: usage.totalPoints,
        appName: usage.appName,
        sourceMember: usage.sourceMember,
        list: usage.list
      };
    }),
    total
  };
}
export default NextAPI(handler);
