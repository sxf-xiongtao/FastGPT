import { authCert } from '@fastgpt/service/support/permission/auth/common';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import type { ChatSettingSchema } from '@fastgpt/global/core/chat/setting/type';
import { MongoChatSetting } from '@fastgpt/service/core/chat/setting/schema';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { type ClientSession } from '@fastgpt/service/common/mongo';
import { getSystemToolById } from '@fastgpt/service/core/app/plugin/controller';
import { getLocale } from '@fastgpt/service/common/middle/i18n';
import { parseI18nString } from '@fastgpt/global/common/i18n/utils';

export type getResponse = ChatSettingSchema;

async function handler(req: ApiRequestProps): Promise<getResponse> {
  const { teamId, tmbId } = await authCert({ req, authToken: true });

  const chatSetting = await (async () => {
    const chatSetting = await MongoChatSetting.findOne({ teamId }).lean();
    if (chatSetting) {
      chatSetting.selectedTools = await Promise.all(
        chatSetting.selectedTools.map(async (t) => {
          const tool = await getSystemToolById(t.pluginId || '');
          return {
            ...t,
            name: parseI18nString(tool.name, getLocale(req)),
            avatar: tool.avatar || ''
          };
        })
      );
      return chatSetting;
    }

    return await mongoSessionRun(async (session: ClientSession) => {
      // Check if hidden app already exists for this team
      const hiddenApp = await (async () => {
        const hiddenApp = await MongoApp.findOne(
          {
            teamId,
            type: AppTypeEnum.hidden
          },
          '_id',
          { session }
        );
        if (hiddenApp) return hiddenApp;

        const [newHiddenApp] = await MongoApp.create(
          [
            {
              teamId,
              tmbId,
              name: 'Home App',
              type: AppTypeEnum.hidden,
              version: 'v2'
            }
          ],
          { session, ordered: true }
        );
        return newHiddenApp;
      })();

      const [newSetting] = await MongoChatSetting.create(
        [
          {
            teamId,
            appId: hiddenApp._id
          }
        ],
        { session, ordered: true }
      );
      return newSetting.toObject();
    });
  })();

  return chatSetting;
}

export default NextAPI(handler);
