import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { SystemPluginTemplateItemType } from '@fastgpt/global/core/workflow/type/index';
import { adminCert } from '@/service/support/permission/adminCert';
import { MongoSystemPlugin } from '@fastgpt/service/core/app/plugin/systemPluginSchema';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { PluginSourceEnum } from '@fastgpt/global/core/plugin/constants';
import { getSystemPluginCb } from '@/service/core/workflow/systemPlugins/register';
import { addAuditLog } from '@fastgpt/service/support/user/audit/util';
import { AdminAuditEventEnum } from '@fastgpt/global/support/user/audit/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';

export type createPluginQuery = {};

export type createPluginBody = {
  name: string;
  avatar: string;
  intro?: string;
  templateType: string;
  originCost?: number;
  currentCost?: number;
  hasTokenFee?: boolean;
  inputConfig: SystemPluginTemplateItemType['inputConfig'];
  associatedPluginId?: string;
  userGuide?: string;
  author?: string;
};

export type createPluginResponse = {};

async function handler(
  req: ApiRequestProps<createPluginBody, createPluginQuery>,
  res: ApiResponseType<any>
): Promise<createPluginResponse> {
  const authResult = await adminCert({ req, authToken: true });
  const userDetail = await getUserDetail({ tmbId: authResult.tmbId });
  const {
    name,
    avatar,
    intro,
    templateType,
    inputConfig,
    originCost,
    currentCost,
    hasTokenFee,
    associatedPluginId,
    userGuide,
    author
  } = req.body;

  const pluginId = `${PluginSourceEnum.commercial}-${getNanoid(12)}`;

  await MongoSystemPlugin.create({
    pluginId,
    isActive: true,
    inputConfig,
    originCost,
    currentCost,
    hasTokenFee,
    customConfig: {
      name,
      avatar,
      intro,
      version: getNanoid(),
      templateType,
      associatedPluginId,
      userGuide,
      author
    }
  });

  // 重新获取插件
  await getSystemPluginCb(true);

  (async () => {
    addAuditLog({
      tmbId: authResult.tmbId,
      teamId: userDetail.team.teamId,
      event: AdminAuditEventEnum.ADMIN_CREATE_PLUGIN,
      params: { name, pluginName: name }
    });
  })();

  return {};
}

export default NextAPI(handler);
