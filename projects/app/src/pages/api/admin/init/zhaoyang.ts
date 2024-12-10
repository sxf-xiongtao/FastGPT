import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { NextAPI } from '@/service/middleware/entry';
import { MongoSystemPlugin } from '@fastgpt/service/core/app/plugin/systemPluginSchema';
import { connectionMongo } from '@fastgpt/service/common/mongo';

interface OldPluginType {
  pluginId: string;
  customConfig: {
    associatedPlugin?: {
      _id: string;
      avatar: string;
      name: string;
    };
  };
}

async function migratePluginAssociations() {
  const plugins = await MongoSystemPlugin.find({
    'customConfig.associatedPlugin': { $exists: true }
  }).lean();

  console.log(`找到 ${plugins.length} 个需要迁移的插件`);

  const updateResults = [];
  const errors = [];

  for (const plugin of plugins) {
    try {
      const typedPlugin = plugin as OldPluginType;
      const associatedPluginId = typedPlugin.customConfig?.associatedPlugin?._id;

      const updateObj: any = {};
      if (associatedPluginId) {
        updateObj['customConfig.associatedPluginId'] = associatedPluginId;
        updateObj['$unset'] = { 'customConfig.associatedPlugin': 1 };
      }

      if (Object.keys(updateObj).length === 0) continue;

      const result = await MongoSystemPlugin.updateOne(
        { pluginId: typedPlugin.pluginId },
        updateObj
      );

      console.log(`成功更新插件: ${typedPlugin.pluginId}`);
      updateResults.push(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`处理插件时出错:`, errorMessage);
      errors.push({
        pluginId: (plugin as OldPluginType).pluginId,
        error: errorMessage
      });
    }
  }

  return {
    total: plugins.length,
    updated: updateResults.filter(Boolean).length,
    errors: errors.length > 0 ? errors : undefined
  };
}

async function renameCollection() {
  const db = connectionMongo.connection.db;
  try {
    await db.collection('app_store_groups').rename('app_plugin_groups', { dropTarget: false });
    console.log('集合重命名成功');
    return { success: true };
  } catch (error) {
    console.log('重命名失败:', error);
    return { success: false, error: String(error) };
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await authCert({ req, authRoot: true });

    const [pluginResults, renameResult] = await Promise.all([
      migratePluginAssociations(),
      renameCollection()
    ]);

    jsonRes(res, {
      data: {
        plugins: pluginResults,
        rename: renameResult
      }
    });
  } catch (error) {
    jsonRes(res, {
      code: 500,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

export default NextAPI(handler);
