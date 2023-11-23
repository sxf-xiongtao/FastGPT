import { PostReRankProps, PostReRankResponse } from '@fastgpt/global/core/ai/api';
import { POST } from './request';

export function rerank({ query, inputs }: PostReRankProps) {
  let start = Date.now();
  return POST<PostReRankResponse>('/v1/rerank', {
    query,
    inputs
  })
    .catch((err) => {
      console.log('rerank error', err);
      return Promise.reject(err);
    })
    .finally(() => {
      console.log('rerank time:', Date.now() - start);
    });
}
