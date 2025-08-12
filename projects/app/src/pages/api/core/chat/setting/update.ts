import type { NextApiRequest } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { NextAPI } from '@/service/middleware/entry';
import type {
  ChatSettingSchema,
  ChatSettingUpdateParams
} from '@fastgpt/global/core/chat/setting/type';
import { refreshSourceAvatar } from '@fastgpt/service/common/file/image/controller';
import { MongoChatSetting } from '@fastgpt/service/core/chat/setting/schema';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import type { ApiRequestProps } from '@fastgpt/service/type/next';

async function handler(req: ApiRequestProps<ChatSettingUpdateParams>) {
  const payload = req.body;
  const { teamId } = await authCert({ req, authToken: true });

  const currentSettings = await MongoChatSetting.findOne({ teamId }).lean();

  await mongoSessionRun(async (session) => {
    // Handle TTL removal for uploaded logos
    await refreshSourceAvatar(payload.wideLogoUrl, currentSettings?.wideLogoUrl, session);
    await refreshSourceAvatar(payload.squareLogoUrl, currentSettings?.squareLogoUrl, session);
    console.log(payload);
    // Update or create chat settings
    await MongoChatSetting.updateOne(
      { teamId },
      {
        teamId,
        slogan: payload.slogan || currentSettings?.slogan,
        dialogTips: payload.dialogTips || currentSettings?.dialogTips,
        homeTabTitle: payload.homeTabTitle || currentSettings?.homeTabTitle,
        wideLogoUrl: payload.wideLogoUrl || currentSettings?.wideLogoUrl,
        squareLogoUrl: payload.squareLogoUrl || currentSettings?.squareLogoUrl,
        selectedTools: payload.selectedTools
      },
      {
        new: true,
        session
      }
    );
  });
}

export default NextAPI(handler);
