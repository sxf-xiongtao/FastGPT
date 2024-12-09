import { DELETE, GET, POST, PUT } from '@/service/common/request';
import type { getSystemPluginsResponse } from '@/pages/api/core/app/plugin/getSystemPlugins';
import type { createPluginGroupBody } from '@/pages/api/admin/core/app/pluginGroup/create';
import type { updatePluginGroupBody } from '@/pages/api/admin/core/app/pluginGroup/update';
import type { deletePluginGroupQuery } from '@/pages/api/admin/core/app/pluginGroup/delete';
import type { SystemPluginListItemType } from '@fastgpt/global/core/app/type';
import type { updatePluginGroupOrderBody } from '@/pages/api/admin/core/app/pluginGroup/updateOrder';
import type { updatePluginBody } from '@/pages/api/admin/core/app/plugin/update';
import type { createPluginBody } from '@/pages/api/admin/core/app/plugin/create';
import type { updatePluginOrderBody } from '@/pages/api/admin/core/app/plugin/updateOrder';
import type { deletePluginQuery } from '@/pages/api/admin/core/app/plugin/delete';
import type { ListAppBody } from '@/pages/api/admin/core/app/plugin/allPlugin';
import type { getPluginGroupsResponse } from '@/pages/api/core/app/plugin/getPluginGroups';

export const getSystemPlugins = () => GET<getSystemPluginsResponse>('/admin/core/app/plugin/list');

export const putUpdatePlugin = (data: updatePluginBody) =>
  PUT('/admin/core/app/plugin/update', data);

export const postCreatePlugin = (data: createPluginBody) =>
  POST('/admin/core/app/plugin/create', data);

export const putUpdatePluginOrder = (data: updatePluginOrderBody) =>
  PUT('/admin/core/app/plugin/updateOrder', data);

export const delPlugin = (data: deletePluginQuery) => DELETE('/admin/core/app/plugin/delete', data);

export const postCreatePluginGroup = (data: createPluginGroupBody) =>
  POST('/admin/core/app/pluginGroup/create', data);

export const getPluginGroups = () =>
  GET<getPluginGroupsResponse>('/core/app/plugin/getPluginGroups');

export const putUpdatePluginGroup = (data: updatePluginGroupBody) =>
  PUT('/admin/core/app/pluginGroup/update', data);

export const delPluginGroup = (data: deletePluginGroupQuery) =>
  DELETE('/admin/core/app/pluginGroup/delete', data);

export const getAllUserPlugins = (data: ListAppBody) =>
  POST<SystemPluginListItemType[]>('/admin/core/app/plugin/allPlugin', data);

export const putUpdatePluginGroupOrder = (data: updatePluginGroupOrderBody) =>
  PUT('/admin/core/app/pluginGroup/updateOrder', data);
