import { NextApiRequest, NextApiResponse } from 'next';

export async function licenseCheck(req: NextApiRequest, res: NextApiResponse) {
  if (!global.licenseData) {
    return Promise.reject('系统未激活');
  }

  return;
}
