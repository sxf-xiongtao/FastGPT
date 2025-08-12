import { NextAPI } from '@/service/middleware/entry';
import { adminCert } from '@/service/support/permission/adminCert';
import type { I18nStringType } from '@fastgpt/global/common/i18n/type';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import type { WorkflowTemplateBasicType } from '@fastgpt/global/core/workflow/type/index';
import { MongoSystemPlugin } from '@fastgpt/service/core/app/plugin/systemPluginSchema';
import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import { getLocale } from '@fastgpt/service/common/middle/i18n';
import { parseI18nString } from '@fastgpt/global/common/i18n/utils';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';

export type updatePluginQuery = {};

export type UpdateToolFormType = {
  isActive?: boolean;
  originCost?: number;
  currentCost?: number;
  systemKeyCost?: number;
  hasTokenFee?: boolean;

  inputListVal?: Record<string, any>; // for internal form render
  childConfigs?: ({ pluginId: string } & UpdateToolFormType)[];
};

export type updatePluginBody = UpdateToolFormType & {
  pluginId: string;

  // 自定义插件字段
  name?: I18nStringType | string;
  avatar?: string;
  intro?: I18nStringType | string;
  weight?: number;
  workflow?: WorkflowTemplateBasicType;
  templateType?: string;
  associatedPluginId?: string;
  userGuide?: string;
  author?: string;
};

export type updatePluginResponse = {};

async function handler(
  req: ApiRequestProps<updatePluginBody, updatePluginQuery>,
  res: ApiResponseType<any>
): Promise<updatePluginResponse> {
  const authResult = await adminCert({ req, authToken: true });
  const userDetail = await getUserDetail({ tmbId: authResult.tmbId });
  const { pluginId, ...updateFields } = req.body;

  // 查找插件
  const plugin = await MongoSystemPlugin.findOne({ pluginId });

  // 基础更新字段
  const baseUpdateFields = {
    pluginId,
    isActive: updateFields.isActive,
    originCost: updateFields.originCost,
    currentCost: updateFields.currentCost,
    hasTokenFee: updateFields.hasTokenFee,
    systemKeyCost: updateFields.systemKeyCost,
    inputListVal: updateFields.inputListVal ?? null //Important
  };

  // 如果是自定义插件,需要更新 customConfig
  if (plugin && plugin.customConfig) {
    const isUpdateVersion =
      plugin.customConfig.name !== updateFields.name ||
      plugin.customConfig.avatar !== updateFields.avatar ||
      plugin.customConfig.intro !== updateFields.intro;

    await MongoSystemPlugin.findOneAndUpdate(
      { pluginId },
      {
        ...baseUpdateFields,
        customConfig: {
          name: updateFields.name,
          avatar: updateFields.avatar,
          intro: updateFields.intro,
          version: isUpdateVersion ? getNanoid() : plugin.customConfig.version,
          weight: updateFields.weight,
          workflow: updateFields.workflow,
          templateType: updateFields.templateType,
          associatedPluginId: updateFields.associatedPluginId,
          userGuide: updateFields.userGuide,
          author: updateFields.author
        }
      }
    );
  } else {
    // 系统插件只更新基础字段, 如果有 child，需要更新 child
    await mongoSessionRun(async (session) => {
      await MongoSystemPlugin.updateOne({ pluginId }, baseUpdateFields, { upsert: true, session });

      for await (const tool of updateFields.childConfigs || []) {
        await MongoSystemPlugin.updateOne(
          { pluginId: tool.pluginId },
          {
            pluginId: tool.pluginId,
            isActive: tool.isActive,
            originCost: tool.originCost,
            currentCost: tool.currentCost,
            hasTokenFee: tool.hasTokenFee,
            systemKeyCost: tool.systemKeyCost,

            inputListVal: updateFields.inputListVal ?? null
          },
          { upsert: true, session }
        );
      }
    });
  }

  const lang = getLocale(req);

  (async () => {
    addAuditLog({
      tmbId: authResult.tmbId,
      teamId: userDetail.team.teamId,
      event: AdminAuditEventEnum.ADMIN_UPDATE_PLUGIN,
      params: {
        name: parseI18nString(updateFields.name, lang),
        pluginName: parseI18nString(updateFields.name, lang) || pluginId
      }
    });
  })();

  return {};
}

export default NextAPI(handler);
