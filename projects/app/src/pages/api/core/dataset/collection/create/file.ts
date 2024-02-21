import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { uploadFile } from '@fastgpt/service/common/file/gridfs/controller';
import { getUploadModel } from '@fastgpt/service/common/file/multer';
import { authDataset } from '@fastgpt/service/support/permission/auth/dataset';
import { FileCreateDatasetCollectionParams } from '@fastgpt/global/core/dataset/api';
import { removeFilesByPaths } from '@fastgpt/service/common/file/utils';
import { createOneCollection } from '@fastgpt/service/core/dataset/collection/controller';
import {
  DatasetCollectionTypeEnum,
  TrainingModeEnum
} from '@fastgpt/global/core/dataset/constants';
import { readFileContent } from '@/service/common/file/read/utils';
import { getNanoid, hashStr } from '@fastgpt/global/common/string/tools';
import { splitText2Chunks } from '@fastgpt/global/common/string/textSplitter';
import { checkDatasetLimit } from '@fastgpt/service/support/permission/limit/dataset';
import { predictDataLimitLength } from '@fastgpt/global/core/dataset/utils';
import { pushDataToTrainingQueue } from '@/service/core/dataset/data/controller';
import { createTrainingUsage } from '@fastgpt/service/support/wallet/usage/controller';
import { UsageSourceEnum } from '@fastgpt/global/support/wallet/usage/constants';
import { getDatasetModel, getVectorModel } from '@/service/core/ai/model';
import { BucketNameEnum } from '@fastgpt/global/common/file/constants';

/**
 * Creates the multer uploader
 */
const upload = getUploadModel({
  maxSize: 500 * 1024 * 1024
});

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  let filePaths: string[] = [];

  try {
    await connectToDatabase();

    const { file, data, bucketName } = await upload.doUpload<FileCreateDatasetCollectionParams>(
      req,
      res,
      BucketNameEnum.dataset
    );
    filePaths = [file.path];

    if (!file || !bucketName) {
      throw new Error('file is empty');
    }

    const { teamId, tmbId, dataset } = await authDataset({
      req,
      authApiKey: true,
      per: 'w',
      datasetId: data.datasetId
    });

    const {
      trainingType = TrainingModeEnum.chunk,
      chunkSize = 512,
      chunkSplitter,
      qaPrompt
    } = data;
    const { fileMetadata, collectionMetadata, ...collectionData } = data;
    const collectionName = collectionData.name || file.originalname;

    const relatedImgId = getNanoid();

    // 1. read file
    const { rawText } = await readFileContent({
      teamId,
      path: file.path,
      metadata: {
        ...fileMetadata,
        relatedId: relatedImgId
      }
    });

    // 2. upload file
    const fileId = await uploadFile({
      teamId,
      tmbId,
      bucketName,
      path: file.path,
      filename: file.originalname,
      contentType: file.mimetype,
      metadata: fileMetadata
    });

    // 3. delete tmp file
    removeFilesByPaths(filePaths);

    // 4. split raw text to chunks
    const { chunks } = splitText2Chunks({
      text: rawText,
      chunkLen: chunkSize,
      overlapRatio: trainingType === TrainingModeEnum.chunk ? 0.2 : 0,
      customReg: chunkSplitter ? [chunkSplitter] : []
    });

    // 5. check dataset limit
    await checkDatasetLimit({
      teamId,
      insertLen: predictDataLimitLength(trainingType, chunks),
      standardPlans: global.fatgptMainConfig?.subPlans?.standard
    });

    // 6. create collection and training bill
    const [{ _id: collectionId }, { billId }] = await Promise.all([
      createOneCollection({
        ...collectionData,
        name: collectionName,
        teamId,
        tmbId,
        type: DatasetCollectionTypeEnum.file,
        fileId,
        rawTextLength: rawText.length,
        hashRawText: hashStr(rawText),
        metadata: {
          ...collectionMetadata,
          relatedImgId
        }
      }),
      createTrainingUsage({
        teamId,
        tmbId,
        appName: collectionName,
        billSource: UsageSourceEnum.training,
        vectorModel: getVectorModel(dataset.vectorModel)?.name,
        agentModel: getDatasetModel(dataset.agentModel)?.name
      })
    ]);

    // 7. push chunks to training queue
    const insertResults = await pushDataToTrainingQueue({
      teamId,
      tmbId,
      collectionId,
      trainingMode: trainingType,
      prompt: qaPrompt,
      billId,
      data: chunks.map((text, index) => ({
        q: text,
        chunkIndex: index
      }))
    });

    jsonRes(res, {
      data: { collectionId, results: insertResults }
    });
  } catch (error) {
    removeFilesByPaths(filePaths);
    jsonRes(res, {
      code: 500,
      error
    });
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};
