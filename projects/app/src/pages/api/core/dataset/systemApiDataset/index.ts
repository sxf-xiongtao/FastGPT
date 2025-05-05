import { NextAPI } from '@/service/middleware/entry';
import { NextApiResponse } from 'next';
import {
  APIFileItem,
  ApiFileReadContentResponse,
  ApiDatasetDetailResponse
} from '@fastgpt/global/core/dataset/apiDataset';
import { useFeishuDatasetRequest } from '@/service/core/dataset/feishuDataset/api';
import { useYuqueDatasetRequest } from '@/service/core/dataset/yuqueDataset/api';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import {
  GetProApiDatasetFileContentParams,
  GetProApiDatasetFileDetailParams,
  GetProApiDatasetFileListParams,
  GetProApiDatasetFilePreviewUrlParams,
  ProApiDatasetCommonParams,
  ProApiDatasetOperationTypeEnum
} from '@fastgpt/service/core/dataset/apiDataset/proApi';
import { ParentIdType } from '@fastgpt/global/common/parentFolder/type';

export type FileOperationResponse =
  | APIFileItem[]
  | string
  | ApiFileReadContentResponse
  | ApiDatasetDetailResponse;

export type ProApiDatasetOperationParams = ProApiDatasetCommonParams &
  (
    | { type: ProApiDatasetOperationTypeEnum.LIST; parentId?: ParentIdType }
    | {
        type: ProApiDatasetOperationTypeEnum.READ;
        apiFileId: string;
      }
    | {
        type: ProApiDatasetOperationTypeEnum.CONTENT;
        apiFileId: string;
      }
    | {
        type: ProApiDatasetOperationTypeEnum.DETAIL;
        apiFileId: string;
      }
  );

export type ProApiDatasetOperationResponse =
  | APIFileItem[]
  | string
  | ApiFileReadContentResponse
  | ApiDatasetDetailResponse;

async function handler(
  req: ApiRequestProps<ProApiDatasetOperationParams>,
  res: NextApiResponse
): Promise<ProApiDatasetOperationResponse> {
  const type = req.body.type;

  if (type === ProApiDatasetOperationTypeEnum.LIST) {
    return getProApiDatasetFileListRequest(req.body);
  }
  if (type === ProApiDatasetOperationTypeEnum.READ) {
    return getProApiDatasetFilePreviewUrlRequest(req.body);
  }
  if (type === ProApiDatasetOperationTypeEnum.CONTENT) {
    return getProApiDatasetFileContentRequest(req.body);
  }
  if (type === ProApiDatasetOperationTypeEnum.DETAIL) {
    return getProApiDatasetFileDetailRequest(req.body);
  }

  return Promise.reject('No valid server configuration provided');
}
export default NextAPI(handler);

export const getProApiDatasetFileListRequest = async ({
  feishuServer,
  yuqueServer,
  parentId
}: GetProApiDatasetFileListParams) => {
  if (feishuServer) {
    return useFeishuDatasetRequest({ feishuServer }).listFiles({ parentId });
  }
  if (yuqueServer) {
    return useYuqueDatasetRequest({ yuqueServer }).listFiles({ parentId });
  }
  return Promise.reject('No valid server configuration provided');
};
export const getProApiDatasetFileContentRequest = async ({
  apiFileId,
  feishuServer,
  yuqueServer
}: GetProApiDatasetFileContentParams) => {
  if (feishuServer) {
    return useFeishuDatasetRequest({ feishuServer }).getFileContent({ apiFileId });
  }
  if (yuqueServer) {
    return useYuqueDatasetRequest({ yuqueServer }).getFileContent({ apiFileId });
  }
  return Promise.reject('No valid server configuration provided');
};
export const getProApiDatasetFilePreviewUrlRequest = async ({
  apiFileId,
  feishuServer,
  yuqueServer
}: GetProApiDatasetFilePreviewUrlParams) => {
  if (feishuServer) {
    return useFeishuDatasetRequest({ feishuServer }).getFilePreviewUrl({ apiFileId });
  }
  if (yuqueServer) {
    return useYuqueDatasetRequest({ yuqueServer }).getFilePreviewUrl({ apiFileId });
  }
  return Promise.reject('No valid server configuration provided');
};
export const getProApiDatasetFileDetailRequest = async ({
  apiFileId,
  feishuServer,
  yuqueServer
}: GetProApiDatasetFileDetailParams) => {
  if (yuqueServer) {
    return useYuqueDatasetRequest({ yuqueServer }).getFileDetail({ apiFileId });
  }
  return Promise.reject('No valid server configuration provided');
};
