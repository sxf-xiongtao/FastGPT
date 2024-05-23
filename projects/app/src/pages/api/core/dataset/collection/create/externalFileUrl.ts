import type { NextApiResponse } from 'next';
import { authDataset } from '@fastgpt/service/support/permission/auth/dataset';
import type { ExternalFileCreateDatasetCollectionParams } from '@fastgpt/global/core/dataset/api';
import { createOneCollection } from '@fastgpt/service/core/dataset/collection/controller';
import {
  DatasetCollectionTypeEnum,
  DatasetSourceReadTypeEnum,
  TrainingModeEnum
} from '@fastgpt/global/core/dataset/constants';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoImage } from '@fastgpt/service/common/file/image/schema';
import { checkDatasetLimit } from '@fastgpt/service/support/permission/teamLimit';
import { predictDataLimitLength } from '@fastgpt/global/core/dataset/utils';
import { pushDataListToTrainingQueue } from '@fastgpt/service/core/dataset/training/controller';
import { createTrainingUsage } from '@fastgpt/service/support/wallet/usage/controller';
import { UsageSourceEnum } from '@fastgpt/global/support/wallet/usage/constants';
import { getLLMModel, getVectorModel } from '@fastgpt/service/core/ai/model';
import { getNanoid, hashStr } from '@fastgpt/global/common/string/tools';
import { rawText2Chunks, readDatasetSourceRawText } from '@fastgpt/service/core/dataset/read';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps } from '@fastgpt/service/type/next';

async function handler(
  req: ApiRequestProps<ExternalFileCreateDatasetCollectionParams>,
  res: NextApiResponse<any>
): Promise<{
  collectionId: string;
  insertLen: number;
}> {
  let {
    externalFileUrl,
    externalFileId,
    filename,
    trainingType = TrainingModeEnum.chunk,
    chunkSize = 512,
    chunkSplitter,
    qaPrompt,
    ...body
  } = req.body;

  const { teamId, tmbId, dataset } = await authDataset({
    req,
    authToken: true,
    authApiKey: true,
    per: 'w',
    datasetId: body.datasetId
  });

  const parseFilename = decodeURIComponent(
    filename || externalFileUrl.split('/').pop() || 'Unknow file'
  );
  const relatedId = getNanoid(24);

  // 1. read file
  const rawText = await readDatasetSourceRawText({
    teamId,
    type: DatasetSourceReadTypeEnum.externalFile,
    sourceId: externalFileUrl,
    isQAImport: false,
    relatedId
  });
  // 2. split chunks
  const chunks = rawText2Chunks({
    rawText,
    chunkLen: chunkSize,
    overlapRatio: trainingType === TrainingModeEnum.chunk ? 0.2 : 0,
    customReg: chunkSplitter ? [chunkSplitter] : []
  });

  // 3. auth limit
  await checkDatasetLimit({
    teamId,
    insertLen: predictDataLimitLength(trainingType, chunks)
  });

  const { collectionId, insertLen } = await mongoSessionRun(async (session) => {
    // 4. create collection
    const { _id: collectionId } = await createOneCollection({
      ...body,
      teamId,
      tmbId,
      type: DatasetCollectionTypeEnum.file,
      name: parseFilename,
      metadata: {
        relatedImgId: relatedId
      },

      // special metadata
      trainingType,
      chunkSize,
      chunkSplitter,
      qaPrompt,

      externalFileUrl,
      externalFileId,

      hashRawText: hashStr(rawText),
      rawTextLength: rawText.length,
      session
    });

    // 5. create training bill
    const { billId } = await createTrainingUsage({
      teamId,
      tmbId,
      appName: parseFilename,
      billSource: UsageSourceEnum.training,
      vectorModel: getVectorModel(dataset.vectorModel)?.name,
      agentModel: getLLMModel(dataset.agentModel)?.name,
      session
    });

    // 6. insert to training queue
    const { insertLen } = await pushDataListToTrainingQueue({
      teamId,
      tmbId,
      datasetId: dataset._id,
      collectionId,
      agentModel: dataset.agentModel,
      vectorModel: dataset.vectorModel,
      trainingMode: trainingType,
      prompt: qaPrompt,
      billId,
      data: chunks.map((item, index) => ({
        ...item,
        chunkIndex: index
      })),
      session
    });

    // 7. remove related image ttl
    await MongoImage.updateMany(
      {
        teamId,
        'metadata.relatedId': relatedId
      },
      {
        // Remove expiredTime to avoid ttl expiration
        $unset: {
          expiredTime: 1
        }
      },
      {
        session
      }
    );

    return { collectionId, insertLen };
  });

  return {
    collectionId,
    insertLen
  };
}

export default NextAPI(handler);
