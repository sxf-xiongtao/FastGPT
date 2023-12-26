import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { UserModelSchema as UserType } from '@fastgpt/global/support/user/type';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { NextApiRequest, NextApiResponse } from 'next';

export const isValidObjectIdString = (str: string) => {
  const mongoose = require('mongoose');
  return mongoose.Types.ObjectId.isValid(str);
};

export default async function getUsers(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const start = parseInt(req.query._start as string) || 0;
    const end = parseInt(req.query._end as string) || 20;
    const search = (req.query.search as string) || '';

    let where = {};
    if (search && isValidObjectIdString(search)) {
      where = {
        $or: [{ _id: Object(search) }, { username: new RegExp(search, 'i') }]
      };
    } else if (search) {
      where = {
        username: new RegExp(search, 'i')
      };
    }

    const usersRaw: UserType[] = await MongoUser.find(where)
      .skip(start)
      .limit(end - start);

    const users = await Promise.all(
      usersRaw.map(async (user) => {
        const tmb = await MongoTeamMember.find({ userId: user._id });
        const owner = tmb.find((tmb) => tmb.role === 'owner');

        return {
          userId: user._id,
          id: owner?._id,
          status: user.status,
          avatar: user.avatar,
          username: user.username,
          createTime: user.createTime
        };
      })
    );

    const totalCount = await MongoUser.countDocuments(where);

    jsonRes(res, {
      data: {
        users,
        total: totalCount
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
