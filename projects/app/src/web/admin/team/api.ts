import { POST } from '@/service/common/request';
import type { PaginationResponse } from '@fastgpt/web/common/fetch/type';
import type { TeamMemberItemType } from '@fastgpt/global/support/user/team/type.d';
import type { MemberListBody } from '@/pages/api/support/user/team/member/list';

export const getTeamMembers = (props: MemberListBody) =>
  POST<PaginationResponse<TeamMemberItemType>>(`/support/user/team/member/list`, props);
