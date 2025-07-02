import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';

import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { authTokenFromTeamDomain } from '@/service/support/user/team/tagController';
import type { AuthTeamTagTokenProps } from '@fastgpt/global/support/user/team/tag';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId, teamToken } = req.query as AuthTeamTagTokenProps;

    const teamInfo = await MongoTeam.findById(teamId);
    const teamDomain = teamInfo?.teamDomain;

    if (!teamDomain) {
      throw new Error('The team is not using space to chat');
    }

    jsonRes(res, {
      data: await authTokenFromTeamDomain(teamDomain, teamToken)
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
