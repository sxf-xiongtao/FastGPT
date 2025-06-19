import { NextAPI } from '@/service/middleware/entry';
import { authDataset } from '@fastgpt/service/support/permission/dataset/auth';
import {
  PerResourceTypeEnum,
  ManagePermissionVal
} from '@fastgpt/global/support/permission/constant';
import { DatasetCollaboratorDeleteParams } from '@fastgpt/global/core/dataset/collaborator';
import {
  delResourcePermission,
  getResourceClbsAndGroups
} from '@fastgpt/service/support/permission/controller';
import { ApiRequestProps } from '@fastgpt/service/type/next';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { DatasetTypeEnum } from '@fastgpt/global/core/dataset/constants';
import {
  syncChildrenPermission,
  syncCollaborators
} from '@fastgpt/service/support/permission/inheritPermission';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import {
  getI18nCollaboratorItemType,
  getI18nDatasetType
} from '@fastgpt/service/support/user/audit/util';

async function handler(req: ApiRequestProps<{}, DatasetCollaboratorDeleteParams>) {
  // Authorization
  const { datasetId, tmbId, groupId, orgId } = req.query;

  const {
    teamId,
    dataset,
    tmbId: operatorTmbId
  } = await authDataset({
    req,
    authToken: true,
    datasetId,
    per: ManagePermissionVal
  });

  await mongoSessionRun(async (session) => {
    if (dataset.type == DatasetTypeEnum.folder) {
      const folderClbsAndGroups = await getResourceClbsAndGroups({
        teamId,
        resourceId: datasetId,
        resourceType: PerResourceTypeEnum.dataset,
        session
      });

      await delResourcePermission({
        resourceType: PerResourceTypeEnum.dataset,
        teamId,
        tmbId,
        groupId,
        orgId,
        resourceId: dataset._id,
        session
      });

      await syncChildrenPermission({
        resource: dataset,
        folderTypeList: [DatasetTypeEnum.folder],
        resourceType: PerResourceTypeEnum.dataset,
        resourceModel: MongoDataset,
        collaborators: folderClbsAndGroups.filter((clb) => String(clb.tmbId) !== tmbId),
        session
      });
    } else {
      if (dataset.inheritPermission && dataset.parentId) {
        const parentClbsAndGroups = await getResourceClbsAndGroups({
          teamId,
          resourceId: dataset.parentId,
          resourceType: PerResourceTypeEnum.dataset,
          session
        });

        await syncCollaborators({
          teamId,
          resourceId: datasetId,
          resourceType: PerResourceTypeEnum.dataset,
          session,
          collaborators: parentClbsAndGroups.filter((clb) => String(clb.tmbId) !== tmbId)
        });
      } else {
        await delResourcePermission({
          resourceType: PerResourceTypeEnum.dataset,
          teamId,
          tmbId,
          groupId,
          orgId,
          resourceId: dataset._id,
          session
        });
      }
    }

    if (dataset.inheritPermission && dataset.parentId) {
      await MongoDataset.updateOne(
        { _id: dataset._id },
        {
          inheritPermission: false
        }
      ).session(session);
    }
  });

  (async () => {
    const getItemName = async () => {
      if (tmbId) {
        const member = await MongoTeamMember.findOne({ _id: tmbId }, 'name').exec();
        return member?.name || tmbId;
      }
      if (groupId) {
        const group = await MongoMemberGroupModel.findOne({ _id: groupId }, 'name').exec();
        return group?.name || groupId;
      }
      if (orgId) {
        const org = await MongoOrgModel.findOne({ _id: orgId }, 'name').exec();
        return org?.name || orgId;
      }
      return '';
    };

    const itemType = getI18nCollaboratorItemType(tmbId, groupId, orgId);
    const itemName = await getItemName();
    const datasetType = getI18nDatasetType(dataset.type);
    addAuditLog({
      tmbId: operatorTmbId,
      teamId,
      event: AuditEventEnum.DELETE_DATASET_COLLABORATOR,
      params: {
        datasetName: dataset.name,
        itemName: itemType,
        itemValueName: itemName,
        datasetType: datasetType
      }
    });
  })();
}

export default NextAPI(handler);
