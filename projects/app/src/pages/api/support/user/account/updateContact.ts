import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { authCode } from '@fastgpt/service/support/user/auth/controller';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
export type UpdateContactQuery = {};
export type UpdateContactBody = {
  contact: string;
  verifyCode: string;
};
export type UpdateContactResponse = {};

async function handler(
  req: ApiRequestProps<UpdateContactBody, UpdateContactQuery>,
  _res: ApiResponseType<any>
): Promise<UpdateContactResponse> {
  const { userId } = await parseHeaderCert({ req, authToken: true });
  const { contact, verifyCode } = req.body;

  await authCode({
    type: 'bindNotification',
    code: verifyCode,
    key: contact
  });

  await MongoUser.findOneAndUpdate(
    { _id: userId },
    {
      $set: {
        contact
      }
    }
  );

  // check team notification account, and update if not exist
  const team = await MongoTeam.findOne({ ownerId: userId });
  if (team) {
    if (!team.notificationAccount) {
      team.notificationAccount = contact;
      await team.save();
    }
  }
  return {};
}

export default NextAPI(handler);
