import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { authCode } from '@/service/support/user/auth/controller';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { OwnerPermissionVal } from '@fastgpt/global/support/permission/constant';

export type UpdateNotificationMethodQuery = {};
export type UpdateNotificationMethodBody = {
  account: string;
  verifyCode: string;
};
export type UpdateNotificationMethodResponse = {};

async function handler(
  req: ApiRequestProps<UpdateNotificationMethodBody, UpdateNotificationMethodQuery>,
  _res: ApiResponseType<any>
): Promise<UpdateNotificationMethodResponse> {
  const { teamId } = await authUserPer({ req, authToken: true, per: OwnerPermissionVal });
  const { account, verifyCode } = req.body;
  await authCode({
    type: 'bindNotification',
    code: verifyCode,
    username: account
  });

  await MongoTeam.updateOne(
    {
      _id: teamId
    },
    {
      notificationAccount: account
    }
  );

  return {};
}

export default NextAPI(handler);
