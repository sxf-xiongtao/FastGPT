import { GET, POST, PUT } from '@/service/common/request';
import type { updateSystemPluginBody } from '@/pages/api/admin/core/app/systemPlugin/update';
import type { getSystemPluginsResponse } from '@/pages/api/core/app/plugin/getSystemPlugins';

export const getSystemPlugins = () =>
  GET<getSystemPluginsResponse>('/admin/core/app/systemPlugin/list');

export const putUpdateSystemPlugin = (data: updateSystemPluginBody) =>
  PUT('/admin/core/app/systemPlugin/update', data);
