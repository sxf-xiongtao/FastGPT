import type { createTemplateBody } from '@/pages/api/admin/core/app/templates/create';
import type { deleteTemplateQuery } from '@/pages/api/admin/core/app/templates/delete';
import type { getSystemTemplatesResponse } from '@/pages/api/admin/core/app/templates/list';
import type { updateTemplateBody } from '@/pages/api/admin/core/app/templates/update';
import type { updateTemplateOrderBody } from '@/pages/api/admin/core/app/templates/updateOrder';
import type { updateQuickTemplateBody } from '@/pages/api/admin/core/app/templates/updateQuickTemplate';
import type { deleteTemplateTypeQuery } from '@/pages/api/admin/core/app/templateType/delete';
import type { SaveTemplateTypeBody } from '@/pages/api/admin/core/app/templateType/save';
import type { updateTemplateTypeOrderBody } from '@/pages/api/admin/core/app/templateType/updateOrder';
import type { getTemplateTypesResponse } from '@/pages/api/core/app/template/getTemplateTypes';
import { DELETE, GET, POST, PUT } from '@/service/common/request';

export const getSystemTemplates = () =>
  GET<getSystemTemplatesResponse>('/admin/core/app/templates/list');

export const postCreateTemplate = (data: createTemplateBody) =>
  POST('/admin/core/app/templates/create', data);

export const putUpdateTemplate = (data: updateTemplateBody) =>
  PUT('/admin/core/app/templates/update', data);

export const delTemplate = (data: deleteTemplateQuery) =>
  DELETE('/admin/core/app/templates/delete', data);

export const putUpdateQuickTemplate = (data: updateQuickTemplateBody) =>
  PUT('/admin/core/app/templates/updateQuickTemplate', data);

export const putUpdateTemplateOrder = (data: updateTemplateOrderBody) =>
  PUT('/admin/core/app/templates/updateOrder', data);

export const getTemplateTypes = () =>
  GET<getTemplateTypesResponse>('/core/app/template/getTemplateTypes');

export const postSaveTemplateType = (data: SaveTemplateTypeBody) =>
  POST('/admin/core/app/templateType/save', data);

export const delTemplateType = (data: deleteTemplateTypeQuery) =>
  DELETE('/admin/core/app/templateType/delete', data);

export const putUpdateTemplateTypeOrder = (data: updateTemplateTypeOrderBody) =>
  PUT('/admin/core/app/templateType/updateOrder', data);
