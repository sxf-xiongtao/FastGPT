import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const filename =
      process.env.NODE_ENV === 'development' ? 'data/menuConfig.json' : '/menuConfig.json';
    const filePath = path.join(process.cwd(), filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const config = JSON.parse(fileContent);
    res.status(200).json(config);
  } catch (err) {
    console.error('Failed to read menuConfig file:', err);
    if (err === 'unAuthorization') {
      res.status(403).json({ error: 'unAuthorization' });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
