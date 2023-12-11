import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { uploadMongoImg } from '@fastgpt/service/common/file/image/controller';
import { adminCert } from '@/service/support/permission/adminCert';
import mongoose from 'mongoose';

type Props = { base64Img: string; expiredTime?: Date };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await adminCert({ req, authToken: true });
    const { base64Img, expiredTime } = req.body as Props;

    const data = await uploadMongoImg({
      teamId: new mongoose.Types.ObjectId(),
      base64Img,
      expiredTime
    });

    jsonRes(res, { data });
  } catch (error) {
    jsonRes(res, {
      code: 500,
      error
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '16mb'
    }
  }
};
