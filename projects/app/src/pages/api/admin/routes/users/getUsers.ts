import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { NextApiRequest, NextApiResponse } from 'next';

export const isValidObjectIdString = (str: string) => {
  const mongoose = require('mongoose');
  return mongoose.Types.ObjectId.isValid(str);
};

export default async function getUsers(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    const {
      pageNum = 1,
      pageSize = 20,
      username
    } = req.body as {
      pageNum: number;
      pageSize: number;
      username: string;
    };

    const match = {
      username: new RegExp(username, 'i')
    };

    const [records, total] = await Promise.all([
      MongoUser.find(match)
        .sort({ createTime: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      MongoUser.countDocuments(match)
    ]);

    jsonRes(res, {
      data: {
        pageNum,
        pageSize,
        data: records,
        total
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
