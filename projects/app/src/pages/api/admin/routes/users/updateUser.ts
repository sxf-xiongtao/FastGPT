import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/service/mongo';
import { adminCert } from '@/service/support/permission/adminCert';

export default async function updateUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });

    let { _id: id, password, status } = req.body;

    const result = await MongoUser.findByIdAndUpdate(id, {
      ...(password && { password }),
      ...(status && { status })
    });

    jsonRes(res, {
      data: {
        result
      }
    });
  } catch (err) {
    console.log(`Error updating user: ${err}`);
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
