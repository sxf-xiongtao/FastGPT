import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { connectionMongo } from '@fastgpt/service/common/mongo';
import { MongoUserInform } from '@/service/support/user/inform/schema';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { MongoBill } from '@/service/support/wallet/bill/schema';
import { MongoChat } from '@fastgpt/service/core/chat/chatSchema';
import { MongoChatItem } from '@fastgpt/service/core/chat/chatItemSchema';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { MongoDatasetCollection } from '@fastgpt/service/core/dataset/collection/schema';
import { MongoDatasetData } from '@fastgpt/service/core/dataset/data/schema';
import { MongoDatasetTraining } from '@fastgpt/service/core/dataset/training/schema';
import { MongoImage } from '@fastgpt/service/common/file/image/schema';

export type syncIndexQuery = {};

export type syncIndexBody = {};

export type syncIndexResponse = {};

/* 同步数据的索引 */
async function handler(
  req: ApiRequestProps<syncIndexBody, syncIndexQuery>,
  res: ApiResponseType<any>
): Promise<syncIndexResponse> {
  await authCert({ req, authRoot: true });

  try {
    MongoUserInform.syncIndexes();
    MongoApp.syncIndexes();
    MongoBill.syncIndexes();
    MongoUserInform.syncIndexes();
    MongoChat.syncIndexes();
    MongoChatItem.syncIndexes();
    MongoDataset.syncIndexes();
    MongoDatasetCollection.syncIndexes();
    MongoDatasetData.syncIndexes();
    MongoDatasetTraining.syncIndexes();
    MongoImage.syncIndexes();
  } catch (error) {}

  return {};
}

export default NextAPI(handler);
