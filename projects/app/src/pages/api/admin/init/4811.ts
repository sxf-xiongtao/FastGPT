import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { NextAPI } from '@/service/middleware/entry';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { addLog } from '@fastgpt/service/common/system/log';
import { BillStatusEnum } from '@fastgpt/global/support/wallet/bill/constants';
import { MongoTeamSub } from '@fastgpt/service/support/wallet/sub/schema';
import { StandardSubLevelEnum, SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import { initTeamFreePlan } from '@fastgpt/service/support/wallet/sub/utils';
import { delay } from '@fastgpt/global/common/system/utils';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { reComputeStandPlans } from '@/service/support/wallet/sub/controller';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await authCert({ req, authRoot: true });

  await MongoResourcePermission.deleteMany({
    resourceType: PerResourceTypeEnum.team,
    permission: 4
  });

  jsonRes(res, {
    message: 'success'
  });
}

export default NextAPI(handler);
