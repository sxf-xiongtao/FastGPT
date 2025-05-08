import { MongoUser } from '@fastgpt/service/support/user/schema';
import { NextApiRequest, NextApiResponse } from 'next';

import { adminCert } from '@/service/support/permission/adminCert';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await adminCert({ req, authToken: true });

  const { _id: id, password, status, username } = req.body;

  const result = await MongoUser.findByIdAndUpdate(id, {
    ...(username && { username }),
    ...(password && { password }),
    ...(status !== undefined && { status })
  });

  return {
    result
  };
}

export default NextAPI(handler);
