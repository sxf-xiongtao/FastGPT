import { adminCert } from '@/service/support/permission/adminCert';
import { NextApiResponse } from 'next';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { BillStatusEnum, BillTypeEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { PagingData } from '@/types';
import { BillSchemaType } from '@fastgpt/global/support/wallet/bill/type';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';

export type GetPaysBody = {
  pageNum: number;
  pageSize: number;
  type?: BillTypeEnum;
  status?: BillStatusEnum;
  username: string;
};
export type GetPaysResponse = PagingData<BillSchemaType & { username: string }>;

async function handler(
  req: ApiRequestProps<GetPaysBody>,
  res: NextApiResponse
): Promise<GetPaysResponse> {
  await adminCert({ req, authToken: true });

  const { pageNum = 1, pageSize = 20, type, status, username } = req.body;

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
    MongoBill.find(match)
      .sort({ createTime: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    MongoBill.countDocuments(match)
  ]);

  const newRecords = await Promise.all(
    records.map(async (record) => {
      const tmbId = record.tmbId;
      const tmb = await MongoTeamMember.findOne({ _id: tmbId }, 'userId').populate(
        'userId',
        'username'
      );

      return {
        ...record,
        // @ts-ignore
        username: tmb?.userId?.username || ''
      };
    })
  );

  return {
    pageNum,
    pageSize,
    data: newRecords,
    total
  };
}

export default NextAPI(handler);
