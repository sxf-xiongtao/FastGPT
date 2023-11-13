import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { PostReRankProps, PostReRankResponse } from '@fastgpt/global/core/ai/api';
import { FastAPI } from '@/service/core/fastapi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    await authCert({ req, authRoot: true });
    const { query, inputs } = req.body as PostReRankProps;

    if (global.systemConfig?.system?.fastAPIBaseUrl) {
      // ReRank retrieval data
      return jsonRes<PostReRankResponse>(res, {
        data: await FastAPI.rerank({ query, inputs })
      });
    }

    jsonRes(res, {
      data: inputs.map((item) => ({
        id: item.id
      }))
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
