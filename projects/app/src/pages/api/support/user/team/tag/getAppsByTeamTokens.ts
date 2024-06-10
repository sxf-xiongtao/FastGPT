import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { authTokenFromTeamDomain } from '@/service/support/user/team/tagController';
import { AuthTeamTagTokenProps } from '@fastgpt/global/support/user/team/tag';
import { AppListItemType } from '@fastgpt/global/core/app/type';
import { PermissionTypeEnum } from '@fastgpt/global/support/permission/constant';
import { AppDefaultPermission } from '@fastgpt/global/support/permission/app/constant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    const { teamId, teamToken } = req.query as AuthTeamTagTokenProps;

    const teamInfo = await MongoTeam.findById(teamId);
    const teamDomain = teamInfo?.teamDomain;

    if (!teamDomain) {
      throw new Error('The team is not using space to chat');
    }
    const userInfo = await authTokenFromTeamDomain(teamDomain, teamToken);

    const { tags } = userInfo;

    const query = {
      teamId: teamId,
      teamTags: { $in: tags }
    };

    const apps = await MongoApp.find(query);
    jsonRes<AppListItemType[]>(res, {
      data: apps.map((app) => ({
        _id: app._id,
        name: app.name,
        avatar: app.avatar,
        intro: app.intro,
        isOwner: false,
        defaultPermission: AppDefaultPermission,
        permission: PermissionTypeEnum.public
      }))
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
