import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import { jsonRes } from '@fastgpt/service/common/response';
import { readConfigData } from '@/service/common/file/reqd';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const fileContent = readConfigData('menuConfig.json');
    const config = JSON.parse(fileContent);
    jsonRes(res, {
      data: {
        config: config,
        oneAPIUrl: process.env.ONEAPI_URL
      }
    });
  } catch (err) {
    console.error('Failed to read menuConfig file:', err);
    jsonRes(res, {
      code: 500,
      message: 'Failed to read menuConfig file'
    });
  }
}
