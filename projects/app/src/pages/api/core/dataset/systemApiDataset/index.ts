import { NextAPI } from '@/service/middleware/entry';
import { NextApiRequest, NextApiResponse } from 'next';
import {
  APIFileItem,
  ApiFileReadContentResponse,
  FeishuServer,
  YuqueServer
} from '@fastgpt/global/core/dataset/apiDataset';
import { useFeishuDatasetRequest } from '@/service/core/dataset/feishuDataset/api';
import { useYuqueDatasetRequest } from '@/service/core/dataset/yuqueDataset/api';

export enum FileOperationType {
  LIST = 'list',
  READ = 'read',
  CONTENT = 'content'
}

export type FileOperationQuery = {};

export type FileOperationBody = {
  type: FileOperationType;
  apiFileId?: string;
  parentId?: string | null;
  feishuServer?: FeishuServer;
  yuqueServer?: YuqueServer;
};

export type FileOperationResponse = APIFileItem[] | string | ApiFileReadContentResponse;

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FileOperationResponse>
): Promise<FileOperationResponse> {
  const {
    type,
    apiFileId,
    parentId = null,
    feishuServer,
    yuqueServer
  } = req.body as FileOperationBody;

  if (!feishuServer && !yuqueServer) {
    return Promise.reject('feishuServer or yuqueServer is required');
  }

  if (feishuServer) {
    const feishuRequest = useFeishuDatasetRequest({ feishuServer });
    switch (type) {
      case FileOperationType.LIST:
        return feishuRequest.listFiles({ parentId });
      case FileOperationType.READ:
        return feishuRequest.getFilePreviewUrl({ apiFileId: apiFileId! });
      case FileOperationType.CONTENT:
        return feishuRequest.getFileContent({ apiFileId: apiFileId! });
      default:
        return Promise.reject('Invalid operation type');
    }
  }

  if (yuqueServer) {
    const yuqueRequest = useYuqueDatasetRequest({ yuqueServer });
    switch (type) {
      case FileOperationType.LIST:
        return yuqueRequest.listFiles({ parentId });
      case FileOperationType.READ:
        return yuqueRequest.getFilePreviewUrl({ apiFileId: apiFileId! });
      case FileOperationType.CONTENT:
        return yuqueRequest.getFileContent({ apiFileId: apiFileId! });
      default:
        return Promise.reject('Invalid operation type');
    }
  }

  return Promise.reject('No valid server configuration provided');
}

export default NextAPI(handler);
