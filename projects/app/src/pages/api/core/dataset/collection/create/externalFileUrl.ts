import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import type {
  ExternalFileCreateDatasetCollectionParams,
  PushDatasetDataResponse
} from '@fastgpt/global/core/dataset/api';
import { createCollectionAndInsertData } from '@fastgpt/service/core/dataset/collection/controller';
import {
  DatasetCollectionTypeEnum,
  DatasetSourceReadTypeEnum,
  TrainingModeEnum
} from '@fastgpt/global/core/dataset/constants';
import { readDatasetSourceRawText } from '@fastgpt/service/core/dataset/read';
import { NextAPI } from '@/service/middleware/entry';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { WritePermissionVal } from '@fastgpt/global/support/permission/constant';

async function handler(req: ApiRequestProps<ExternalFileCreateDatasetCollectionParams>): Promise<{
  collectionId: string;
  insertLen: number;
  results: PushDatasetDataResponse;
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

  if (!externalFileId) {
    return Promise.reject('Missing externalFileId');
  }

  const { teamId, tmbId, dataset } = await authDataset({
    req,
    authToken: true,
    authApiKey: true,
    per: WritePermissionVal,
    datasetId: body.datasetId
  });

  const parseFilename = decodeURIComponent(
    filename || externalFileUrl.split('/').pop() || 'Unknow file'
  );

  // 1. read file
  const rawText = await readDatasetSourceRawText({
    teamId,
    type: DatasetSourceReadTypeEnum.externalFile,
    sourceId: externalFileUrl,
    isQAImport: false,
    externalFileId
  });

  const { collectionId, insertResults } = await createCollectionAndInsertData({
    dataset,
    rawText,
    relatedId: externalFileId,
    createCollectionParams: {
      ...body,
      teamId,
      tmbId,
      type: DatasetCollectionTypeEnum.externalFile,
      name: parseFilename,
      metadata: {
        relatedImgId: externalFileId
      },

      // special metadata
      trainingType,
      chunkSize,
      chunkSplitter,
      qaPrompt,

      externalFileUrl,
      externalFileId
    }
  });

  return {
    collectionId,
    results: insertResults,
    insertLen: insertResults.insertLen
  };
}

export default NextAPI(handler);
