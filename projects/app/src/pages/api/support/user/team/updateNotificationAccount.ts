import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { authCode } from '@fastgpt/service/support/user/auth/controller';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { OwnerPermissionVal } from '@fastgpt/global/support/permission/constant';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { addOperationLog } from '@fastgpt/service/support/operationLog/addOperationLog';
import { OperationLogEventEnum } from '@fastgpt/global/support/operationLog/constants';
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
  const { teamId, tmbId } = await authUserPer({ req, authToken: true, per: OwnerPermissionVal });
  const { account, verifyCode } = req.body;
  await authCode({
    type: 'bindNotification',
    code: verifyCode,
    key: account
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
  (async () => {
    addOperationLog({
      tmbId,
      teamId,
      event: OperationLogEventEnum.CHANGE_NOTIFICATION_SETTINGS,
      params: {}
    });
  })();
  return {};
}

export default NextAPI(handler);
