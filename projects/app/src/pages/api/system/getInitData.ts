import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { adminCert } from '@/service/support/permission/adminCert';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await adminCert({ req, authToken: true });
    const filename =
      process.env.NODE_ENV === 'development' ? 'data/formConfig.local.json' : '/formConfig.json';
    const filePath = path.join(process.cwd(), filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const config = JSON.parse(fileContent);
    res.status(200).json(config);
  } catch (error) {
    console.error('Failed to read config file:', error);
    res.status(500).json({ error: 'Failed to get init config' });
  }
}
