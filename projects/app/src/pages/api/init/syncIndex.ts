import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
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
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { MongoTeamTags } from '@fastgpt/service/support/user/team/teamTagsSchema';
import { MongoUsage } from '@fastgpt/service/support/wallet/usage/schema';
import { MongoFrequencyLimit } from '@/service/common/frequencyLimit/schema';
import { MongoOpenApi } from '@fastgpt/service/support/openapi/schema';
import { MongoOutLink } from '@fastgpt/service/support/outLink/schema';
import { MongoRawTextBuffer } from '@fastgpt/service/common/buffer/rawText/schema';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { MongoTimerLock } from '@fastgpt/service/common/system/timerLock/schema';
import { MongoUserAuth } from '@/service/support/user/auth/schema';

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
    MongoUser.syncIndexes();
    MongoTeam.syncIndexes();
    MongoTeamMember.syncIndexes();
    MongoTeamSub.syncIndexes();
    MongoTeamTags.syncIndexes();
    MongoResourcePermission.syncIndexes();

    MongoUsage.syncIndexes();
    MongoFrequencyLimit.syncIndexes();
    MongoOpenApi.syncIndexes();
    MongoOutLink.syncIndexes();
    MongoRawTextBuffer.syncIndexes();
    MongoTimerLock.syncIndexes();
    MongoUserAuth.syncIndexes();

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
