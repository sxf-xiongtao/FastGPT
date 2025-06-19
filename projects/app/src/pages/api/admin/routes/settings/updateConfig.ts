import type { NextApiRequest, NextApiResponse } from 'next';

import { MongoSystemConfigs } from '@fastgpt/service/common/system/config/schema';
import { adminCert } from '@/service/support/permission/adminCert';
import { jsonRes } from '@fastgpt/service/common/response';
import { ConfigStoreType } from '@/global/admin/config';
import { addMonths } from 'date-fns';
import { initFastGPTConfig } from '@fastgpt/service/common/system/tools';
import { beforeUpdateConfig } from '@/service/admin/settings/hooks';
import { updateSystemConfig } from '@/service/common/system/config';
import { SystemConfigsTypeEnum } from '@fastgpt/global/common/system/config/constants';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { fastgpt, fastgptPro } = req.body as ConfigStoreType;

    const authResult = await adminCert({ req, authToken: true });

    if (!fastgpt && !fastgptPro) {
      throw new Error('fastgpt and fastgptPro cannot be empty');
    }

    beforeUpdateConfig(fastgpt, fastgptPro);

    await updateSystemConfig({
      fastgpt,
      fastgptPro
    });
    await MongoSystemConfigs.deleteMany({
      type: { $in: [SystemConfigsTypeEnum.fastgpt, SystemConfigsTypeEnum.fastgptPro] },
      createTime: { $lte: addMonths(new Date(), -1) }
    });

    // update env
    global.systemConfig = fastgptPro;
    initFastGPTConfig(fastgpt);

    console.log(fastgptPro, fastgpt);

    const userDetail = await getUserDetail({ tmbId: authResult.tmbId });
    (async () => {
      addAuditLog({
        tmbId: authResult.tmbId,
        teamId: userDetail.team.teamId,
        event: AdminAuditEventEnum.ADMIN_UPDATE_SYSTEM_CONFIG,
        params: { name: userDetail.username }
      });
    })();

    jsonRes(res, {
      data: 'success'
    });
  } catch (err) {
    console.error(`Error in updateConfig: ${err}`);
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
