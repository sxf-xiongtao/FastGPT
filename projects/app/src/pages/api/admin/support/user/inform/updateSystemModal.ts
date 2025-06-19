import { adminCert } from '@/service/support/permission/adminCert';
import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
export type UpdateSystemModalQuery = {};
export type UpdateSystemModalBody = { content: string };
export type UpdateSystemModalResponse = {};

async function handler(
  req: ApiRequestProps<UpdateSystemModalBody, UpdateSystemModalQuery>,
  _res: ApiResponseType<any>
): Promise<UpdateSystemModalResponse> {
  const { content } = req.body;
  const { tmbId, teamId } = await adminCert({ req, authToken: true });

  const res = await MongoSystemConfigs.updateOne(
    {
      type: SystemConfigsTypeEnum.systemMsgModal
    },
    {
      type: SystemConfigsTypeEnum.systemMsgModal,
      value: {
        id: getNanoid(),
        content
      }
    },
    {
      upsert: true
    }
  );

  if (!res.upsertedId) {
    Promise.reject('更新失败');
  }

  (async () => {
    addAuditLog({
      tmbId,
      teamId,
      event: AdminAuditEventEnum.ADMIN_UPDATE_SYSTEM_MODAL,
      params: {}
    });
  })();

  return {
    message: '发送通知成功'
  };
}

export default NextAPI(handler);
