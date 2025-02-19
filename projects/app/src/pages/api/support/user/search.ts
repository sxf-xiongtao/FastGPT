import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import { ReadPermissionVal } from '@fastgpt/global/support/permission/constant';
import { SearchResult } from '@fastgpt/global/support/user/api';
import { readFromSecondary } from '@fastgpt/service/common/mongo/utils';
import { replaceRegChars } from '@fastgpt/global/common/string/tools';

export type SearchQuery = {
  searchKey: string;
  members?: boolean;
  orgs?: boolean;
  groups?: boolean;
};
export type SearchBody = {};
export type SearchResponse = SearchResult;

/** 用户搜索接口
 * @param searchKey 关键词 可以通过 userId, memberName, contact 搜索
 * */
async function handler(
  req: ApiRequestProps<SearchBody, SearchQuery>,
  _res: ApiResponseType<any>
): Promise<SearchResponse> {
  const {
    searchKey,
    members: searchMembers = true,
    orgs: searchOrgs = true,
    groups: searchGroups = true
  } = req.query;
  const { teamId } = await authUserPer({ req, authToken: true, per: ReadPermissionVal });

  if (!searchKey) {
    return {
      members: [],
      orgs: [],
      groups: []
    };
  }

  const regex = new RegExp(replaceRegChars(searchKey), 'i');

  const members = await (async () => {
    if (searchMembers) {
      const allMembers = await MongoTeamMember.find(
        {
          teamId
        },
        '_id userId name avatar status teamId createTime updateTime',
        {
          ...readFromSecondary
        }
      ).lean();

      const searchedByMemberNameMember = allMembers.filter((member) => regex.test(member.name));

      const searchedMemberUserAndMatchedUser = await MongoUser.find(
        {
          $or: [
            {
              _id: { $in: searchedByMemberNameMember.map((member) => member.userId) }
            },
            {
              $and: [
                {
                  _id: { $in: allMembers.map((member) => member.userId) }
                },
                {
                  $or: [
                    {
                      username: regex
                    },
                    {
                      contact: regex
                    }
                  ]
                }
              ]
            }
          ]
        },
        '_id username contact',
        {
          ...readFromSecondary
        }
      ).lean();

      const memberWithUser = searchedMemberUserAndMatchedUser.map((user) => {
        const tmb = allMembers.find((member) => String(member.userId) === String(user._id))!;
        return {
          ...tmb,
          user: {
            contact: user.contact
          }
        };
      });
      return memberWithUser;
    }
    return [];
  })();

  const [orgs, groups] = await Promise.all([
    searchOrgs
      ? MongoOrgModel.find(
          {
            name: regex,
            teamId
          },
          undefined,
          {
            ...readFromSecondary
          }
        )
          .limit(10)
          .lean()
      : [],
    searchGroups
      ? MongoMemberGroupModel.find(
          {
            teamId,
            name: regex
          },
          undefined,
          {
            ...readFromSecondary
          }
        )
          .limit(10)
          .lean()
      : []
  ]);
  console.log(groups);
  return {
    members: [...members].map((item) => ({
      tmbId: item._id,
      userId: item.userId,
      name: item.name,
      avatar: item.avatar,
      status: item.status,
      teamId: item.teamId,
      createTime: item.createTime,
      updateTime: item.updateTime,
      memberName: item.name,
      role: item.role,
      contact: item.user.contact
    })),
    orgs: orgs.map((item) => ({
      ...item,
      avatar: item.avatar || ''
    })),
    groups
  };
}
export default NextAPI(handler);
