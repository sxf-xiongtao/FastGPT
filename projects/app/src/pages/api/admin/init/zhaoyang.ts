import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { NextAPI } from '@/service/middleware/entry';
import { MongoSystemPlugin } from '@fastgpt/service/core/app/plugin/systemPluginSchema';
import { connectionMongo } from '@fastgpt/service/common/mongo';

interface OldPluginType {
  pluginId: string;
  customConfig: {
    intro: string;
    userGuide: string;
    associatedPlugin?: {
      _id: string;
      avatar: string;
      name: string;
    };
  };
}

async function migratePluginAssociations() {
  const plugins = await MongoSystemPlugin.find({
    $or: [
      { 'customConfig.associatedPlugin': { $exists: true } },
      { 'customConfig.intro': { $exists: true } }
    ]
  }).lean();

  console.log(`找到 ${plugins.length} 个需要迁移的插件`);

  const updateResults = await Promise.all(
    plugins.map((plugin) => {
      const typedPlugin = plugin as OldPluginType;
      const associatedPluginId = typedPlugin.customConfig?.associatedPlugin?._id;
      const intro = typedPlugin.customConfig?.intro;
      const userGuide = typedPlugin.customConfig?.userGuide;

      const updateObj: any = {};
      if (associatedPluginId) {
        updateObj['customConfig.associatedPluginId'] = associatedPluginId;
        updateObj['$unset'] = { 'customConfig.associatedPlugin': 1 };
      }
      // if (intro || userGuide) {
      //   updateObj['customConfig.userGuide'] = `${intro ? intro + '\n\n' : ''}${userGuide || ''}`;
      //   if (intro) {
      //     if (!updateObj['$unset']) updateObj['$unset'] = {};
      //     updateObj['$unset']['customConfig.intro'] = 1;
      //   }
      // }

      if (Object.keys(updateObj).length === 0) return;

      return MongoSystemPlugin.updateOne({ pluginId: typedPlugin.pluginId }, updateObj);
    })
  );

  return {
    total: plugins.length,
    updated: updateResults.filter(Boolean).length
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
