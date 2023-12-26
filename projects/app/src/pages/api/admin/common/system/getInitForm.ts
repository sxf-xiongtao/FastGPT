import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await adminCert({ req, authToken: true });
    const filename =
      process.env.NODE_ENV === 'development' ? 'data/formConfig.json' : '/app/data/formConfig.json';
    const fileContent = fs.readFileSync(filename, 'utf-8');
    const config = JSON.parse(fileContent);
    jsonRes(res, { data: config });
  } catch (error) {
    console.error('Failed to read config file:', error);
    jsonRes(res, { code: 500, message: 'Failed to read config file' });
  }
}
