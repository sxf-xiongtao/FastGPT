import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { NextAPI } from '@/service/middleware/entry';
import { DatasetTagType } from '@fastgpt/global/core/dataset/type';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { MongoDatasetCollectionTags } from '@fastgpt/service/core/dataset/tag/schema';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { PaginationProps, PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { replaceRegChars } from '@fastgpt/global/common/string/tools';
import { parsePaginationRequest } from '@fastgpt/service/common/api/pagination';

export type GetDatasetTagsProps = PaginationProps<{
  datasetId: string;
  searchText?: string;
}>;

async function handler(
  req: ApiRequestProps<GetDatasetTagsProps, {}>
): Promise<PaginationResponse<DatasetTagType>> {
  let { datasetId, searchText } = req.body;
  const { offset, pageSize } = parsePaginationRequest(req);
  if (!datasetId) {
    return Promise.reject(CommonErrEnum.missingParams);
  }
  searchText = searchText?.replace(/'/g, '');

  const { teamId } = await authDataset({
    req,
    authToken: true,
    authApiKey: true,
    datasetId,
    per: ReadPermissionVal
  });

  const match = {
    teamId,
    datasetId,
    ...(searchText
      ? {
          tag: new RegExp(`${replaceRegChars(searchText)}`, 'i')
        }
      : {})
  };

  const [tags, total]: [DatasetTagType[], number] = await Promise.all([
    MongoDatasetCollectionTags.find(match).sort({ _id: -1 }).skip(offset).limit(pageSize).lean(),
    MongoDatasetCollectionTags.countDocuments(match)
  ]);

  return {
    list: tags,
    total
  };
}

export default NextAPI(handler);
