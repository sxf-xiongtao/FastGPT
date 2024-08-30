import { DELETE, GET, POST, PUT } from '@/service/common/request';
import type { updateSystemPluginBody } from '@/pages/api/admin/core/app/systemPlugin/update';
import type { getSystemPluginsResponse } from '@/pages/api/core/app/plugin/getSystemPlugins';
import type { createSystemPluginBody } from '@/pages/api/admin/core/app/customPlugin/create';
import type { updateCustomPluginBody } from '@/pages/api/admin/core/app/customPlugin/update';
import type { deleteCustomPluginQuery } from '@/pages/api/admin/core/app/customPlugin/delete';

export const getSystemPlugins = () =>
  GET<getSystemPluginsResponse>('/admin/core/app/systemPlugin/list');

export const putUpdateSystemPlugin = (data: updateSystemPluginBody) =>
  PUT('/admin/core/app/systemPlugin/update', data);

export const postCreateCustomPlugin = (data: createSystemPluginBody) =>
  POST('/admin/core/app/customPlugin/create', data);

export const putUpdateCustomPlugin = (data: updateCustomPluginBody) =>
  PUT('/admin/core/app/customPlugin/update', data);

export const delCustomPlugin = (data: deleteCustomPluginQuery) =>
  DELETE('/admin/core/app/customPlugin/delete', data);
