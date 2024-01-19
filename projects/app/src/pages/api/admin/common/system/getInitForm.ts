import type { NextApiRequest, NextApiResponse } from 'next';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { readConfigData } from '@/service/common/file/loadConfig';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await adminCert({ req, authToken: true });
    const fileContent = readConfigData('formConfig.json');
    const config = JSON.parse(fileContent);
    jsonRes(res, { data: config });
  } catch (error) {
    console.error('Failed to read config file:', error);
    jsonRes(res, { code: 500, message: 'Failed to read config file' });
  }
}
