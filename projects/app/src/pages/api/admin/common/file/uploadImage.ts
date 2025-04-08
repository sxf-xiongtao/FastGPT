import type { NextApiRequest, NextApiResponse } from 'next';

import { uploadMongoImg } from '@fastgpt/service/common/file/image/controller';
import { adminCert } from '@/service/support/permission/adminCert';
import { NextAPI } from '@/service/middleware/entry';

type Props = { base64Img: string };

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teamId } = await adminCert({ req, authToken: true });
  const { base64Img } = req.body as Props;

  return uploadMongoImg({
    teamId,
    base64Img,
    forever: true
  });
}

export default NextAPI(handler);
