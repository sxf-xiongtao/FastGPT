import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { UpdateTeamMemberPermissionProps } from '@fastgpt/global/support/user/team/controller';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/resourcePermission/schema';
import { ResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { authOwner } from '@/service/support/user/team/auth';

// update permission of team member
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();

    const { teamId, memberIds, permission } = req.body as UpdateTeamMemberPermissionProps;
    const { userId } = await authCert({ req, authToken: true });
    await authOwner({ userId, teamId });
    for (let memberId of memberIds) {
      await MongoResourcePermission.findOneAndUpdate(
        {
          teamId,
          tmbId: memberId,
          resourceType: ResourceTypeEnum.team
        },
        {
          permission: permission
        },
        {
          new: true,
          upsert: true
        }
      );
    }

    jsonRes(res, {});
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
