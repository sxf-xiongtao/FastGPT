import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { NextApiRequest, NextApiResponse } from 'next';

import { adminCert } from '@/service/support/permission/adminCert';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await adminCert({ req, authToken: true });

    let { _id: id, password, status, username } = req.body;

    const result = await MongoUser.findByIdAndUpdate(id, {
      ...(username && { username }),
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
