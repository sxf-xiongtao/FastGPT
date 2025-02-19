import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { authCode } from '@/service/support/user/auth/controller';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { OwnerPermissionVal } from '@fastgpt/global/support/permission/constant';
import { MongoUser } from '@fastgpt/service/support/user/schema';

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

  const team = await MongoTeam.findOneAndUpdate(
    {
      _id: teamId
    },
    {
      notificationAccount: account
    }
  );

  // check user contact, and update if not exist
  const user = await MongoUser.findOne({ _id: team?.ownerId });
  if (user) {
    if (!user.contact) {
      await MongoUser.updateOne(
        {
          _id: user._id
        },
        {
          contact: account
        }
      );
    }
  }
  return {};
}

export default NextAPI(handler);
