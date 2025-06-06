import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { changeOwner } from '@/service/core/changeOwner';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import { OwnerPermissionVal } from '@fastgpt/global/support/permission/constant';
import { AppErrEnum } from '@fastgpt/global/common/error/code/app';
import { DatasetErrEnum } from '@fastgpt/global/common/error/code/dataset';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { addOperationLog } from '@fastgpt/service/support/operationLog/addOperationLog';
import { OperationLogEventEnum } from '@fastgpt/global/support/operationLog/constants';
import { getI18nDatasetType } from '@fastgpt/service/support/operationLog/util';
export type AppChangeOwnerQuery = {};
export type AppChangeOwnerBody = {
  ownerId: string;
  datasetId: string;
};
export type AppChangeOwnerResponse = any;

async function handler(
  req: ApiRequestProps<AppChangeOwnerBody, AppChangeOwnerQuery>,
  _res: ApiResponseType<any>
): Promise<AppChangeOwnerResponse> {
  const { ownerId, datasetId } = req.body;
  if (!datasetId || !ownerId) {
    return Promise.reject(CommonErrEnum.missingParams);
  }

  const { dataset, tmbId, teamId } = await authDataset({
    req,
    datasetId,
    authToken: true,
    per: OwnerPermissionVal
  });

  if (!dataset) {
    return Promise.reject(DatasetErrEnum.unExist);
  }

  const oldOwnerId = dataset.tmbId; // the old owner id before changing
  const newOwner = await MongoTeamMember.findById(ownerId); // the new owner
  const oldOwner = await MongoTeamMember.findById(oldOwnerId); // the old owner

  if (!newOwner || String(newOwner.teamId) !== String(dataset.teamId)) {
    return Promise.reject(AppErrEnum.invalidOwner);
  }

  const result = await changeOwner({
    changeOwnerType: 'dataset',
    resourceId: dataset._id,
    newOwnerId: ownerId,
    oldOwnerId: oldOwnerId,
    teamId: dataset.teamId
  });

  addOperationLog({
    tmbId,
    teamId,
    event: OperationLogEventEnum.TRANSFER_DATASET_OWNERSHIP,
    params: {
      datasetName: dataset.name,
      datasetType: getI18nDatasetType(dataset.type),
      oldOwnerName: oldOwner?.name || 'Unknown',
      newOwnerName: newOwner.name
    }
  });

  return result;
}

export default NextAPI(handler);
