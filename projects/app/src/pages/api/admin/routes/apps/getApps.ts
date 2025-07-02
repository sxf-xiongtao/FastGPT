import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { adminCert } from '@/service/support/permission/adminCert';
import type { UserModelSchema } from '@fastgpt/global/support/user/type';
import type { PaginationProps, PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { parsePaginationRequest } from '@fastgpt/service/common/api/pagination';

type AppType = {
  id: string;
  username: string;
  userId: string;
  name: string;
  intro: string;
};

export type AdminGetAPPQuery = {};
export type AdminGetAPPBody = PaginationProps;
export type AdminGetAPPResponse = PaginationResponse<AppType>;

async function handler(
  req: ApiRequestProps<AdminGetAPPBody, AdminGetAPPQuery>,
  _res: ApiResponseType<any>
): Promise<AdminGetAPPResponse> {
  await adminCert({ req, authToken: true });
  const { offset, pageSize } = parsePaginationRequest(req);

  const [apps, total] = await Promise.all([
    MongoApp.find().sort({ updateTime: -1 }).skip(offset).limit(pageSize),
    MongoApp.countDocuments()
  ]);

  const tmbIdList = Array.from(new Set(apps.map((app) => String(app.tmbId))));
  const tmbList = await MongoTeamMember.find({
    _id: {
      $in: tmbIdList
    }
  })
    .populate<{ user: UserModelSchema }>('user')
    .lean();

  const newRecords: AppType[] = await Promise.all(
    apps.map(async (app) => {
      return {
        id: app._id.toString(),
        name: app.name,
        intro: app.intro,
        userId: tmbList.find((tmb) => String(tmb._id) === String(app.tmbId))?.user?._id || '',
        username:
          tmbList.find((tmb) => String(tmb._id) === String(app.tmbId))?.user?.username ||
          '这人被删了'
      };
    })
  );
  return {
    total,
    list: newRecords
  };
}

export default NextAPI(handler);
