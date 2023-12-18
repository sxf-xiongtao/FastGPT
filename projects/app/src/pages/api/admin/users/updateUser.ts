import { jsonRes } from '@fastgpt/service/common/response';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function updateUser(req: NextApiRequest, res: NextApiResponse) {
  try {
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
