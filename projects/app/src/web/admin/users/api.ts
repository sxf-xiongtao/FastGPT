import type { getTeamsResponse } from '@/pages/api/admin/routes/teams/getTeams';
import type { AdminGetUsersResponse } from '@/pages/api/admin/routes/users/getUsers';
import { PlanType } from '@/pages/users/plans';
import { POST } from '@/service/common/request';
import { PaginationResponse } from '@fastgpt/web/common/fetch/type';

export const getUsers = (data: any) =>
  POST<AdminGetUsersResponse>('/admin/routes/users/getUsers', data);

export const getTeams = (data: any) => POST<getTeamsResponse>('/admin/routes/teams/getTeams', data);

export const getPlans = (data: any) =>
  POST<PaginationResponse<PlanType>>('/admin/routes/plans/getPlans', data);
