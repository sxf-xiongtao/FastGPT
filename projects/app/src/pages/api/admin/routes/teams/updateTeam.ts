import { jsonRes } from '@fastgpt/service/common/response';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import type { NextApiRequest, NextApiResponse } from 'next';

import { adminCert } from '@/service/support/permission/adminCert';
import { PRICE_SCALE } from '@fastgpt/global/support/wallet/constants';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const authResult = await adminCert({ req, authToken: true });

    let { id, balance, name } = req.body;

    const oldTeam = await MongoTeam.findById(id);
    if (!oldTeam) {
      throw new Error('团队不存在');
    }

    await MongoTeam.findByIdAndUpdate(id, {
      ...(name && { name: name }),
      ...(balance !== undefined && { balance: balance * PRICE_SCALE })
    });

    const userDetail = await getUserDetail({
      tmbId: authResult.tmbId,
      userId: authResult.userId
    });

    (async () => {
      addAuditLog({
        tmbId: authResult.tmbId,
        teamId: userDetail.team.teamId,
        event: AdminAuditEventEnum.ADMIN_UPDATE_TEAM,
        params: {
          teamName: oldTeam.name,
          newTeamName: name || oldTeam.name,
          newBalance:
            balance !== undefined ? String(balance) : String(oldTeam.balance / PRICE_SCALE)
        }
      });
    })();

    jsonRes(res, {
      data: {
        ...(balance && { balance })
      }
    });
  } catch (err) {
    console.log(`Error updating team: ${err}`);
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
