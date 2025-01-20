import { adminCert } from '@/service/support/permission/adminCert';
import { NextApiResponse } from 'next';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { BillStatusEnum, BillTypeEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { BillSchemaType } from '@fastgpt/global/support/wallet/bill/type';
import { UserModelSchema } from '@fastgpt/global/support/user/type';
import { PaginationProps, PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { parsePaginationRequest } from '@fastgpt/service/common/api/pagination';

export type GetPaysBody = PaginationProps<{
  type?: BillTypeEnum;
  status?: BillStatusEnum;
  username: string;
}>;
export type GetPaysResponse = PaginationResponse<BillSchemaType & { username: string }>;

async function handler(
  req: ApiRequestProps<GetPaysBody>,
  _res: NextApiResponse
): Promise<GetPaysResponse> {
  await adminCert({ req, authToken: true });

  const { type, status, username } = req.body;
  const { offset, pageSize } = parsePaginationRequest(req);

  const match = await (async () => {
    if (username) {
      const users = await MongoUser.find({ username: new RegExp(username, 'i') }, '_id');
      const userIds = users.map((user) => user._id);

      const tmbs = await MongoTeamMember.find({ userId: { $in: userIds } }, 'teamId');
      const teamIds = tmbs.map((tmb) => tmb.teamId);

      console.log(userIds, teamIds);
      return {
        status: status ? status : { $ne: 'CLOSED' },
        teamId: { $in: teamIds },
        ...(type && { type })
      };
    }

    return {
      status: status ? status : { $ne: 'CLOSED' },
      ...(type && { type })
    };
  })();

  const [records, total] = await Promise.all([
    MongoBill.find(match).sort({ createTime: -1 }).skip(offset).limit(pageSize).lean(),
    MongoBill.countDocuments(match)
  ]);

  const newRecords = await Promise.all(
    records.map(async (record) => {
      const tmbId = record.tmbId;
      const tmb = await MongoTeamMember.findOne({ _id: tmbId }, 'userId')
        .populate<{ user: UserModelSchema }>('user', 'username')
        .lean();

      return {
        ...record,
        username: tmb?.user?.username || ''
      };
    })
  );

  return {
    list: newRecords,
    total
  };
}

export default NextAPI(handler);
