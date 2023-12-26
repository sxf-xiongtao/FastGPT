import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { jsonRes } from '@fastgpt/service/common/response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const filename =
      process.env.NODE_ENV === 'development' ? 'data/menuConfig.json' : '/menuConfig.json';
    const filePath = path.join(process.cwd(), filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const config = JSON.parse(fileContent);
    jsonRes(res, {
      data: config
    });
  } catch (err) {
    console.error('Failed to read menuConfig file:', err);
    jsonRes(res, {
      code: 500,
      message: 'Failed to read menuConfig file'
    });
  }
}
