import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { PagingData } from '@/types';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { adminCert } from '@/service/support/permission/adminCert';

type AppType = {
  id: string;
  username: string;
  userId: string;
  name: string;
  intro: string;
};

export type AdminGetAPPQuery = {};
export type AdminGetAPPBody = PagingData;
export type AdminGetAPPResponse = PagingData<AppType>;

async function handler(
  req: ApiRequestProps<AdminGetAPPBody, AdminGetAPPQuery>,
  _res: ApiResponseType<any>
): Promise<AdminGetAPPResponse> {
  await adminCert({ req, authToken: true });
  const { pageNum = 1, pageSize = 20 } = req.body;

  const [apps, total] = await Promise.all([
    MongoApp.find()
      .sort({ createTime: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize),
    MongoApp.countDocuments()
  ]);

  const tmbIdList = Array.from(new Set(apps.map((app) => String(app.tmbId))));
  const tmbList = await MongoTeamMember.find({
    _id: {
      $in: tmbIdList
    }
  }).populate('userId');

  const newRecords: AppType[] = await Promise.all(
    apps.map(async (app) => {
      return {
        id: app._id.toString(),
        name: app.name,
        intro: app.intro,
        userId:
          (
            tmbList.find((tmb) => String(tmb._id) === String(app.tmbId))?.userId as any
          )._id.toString() || '',
        username:
          (tmbList.find((tmb) => String(tmb._id) === String(app.tmbId))?.userId as any)?.username ||
          ''
      };
    })
  );
  return {
    total,
    pageNum,
    pageSize,
    data: newRecords
  };
}

export default NextAPI(handler);
