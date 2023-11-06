import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import {
  authMemberExistTeam,
  authTeamMaxMember,
  authTeamRole
} from '@/service/support/user/team/controller';
import type {
  InviteMemberProps,
  InviteMemberResponse
} from '@fastgpt/global/support/user/team/controller.d';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';
import { authUserExist } from '@fastgpt/service/support/user/controller';
import { MongoTeamMember } from '@/service/support/user/team/teamMemberSchema';
import { TeamErrEnum } from '@fastgpt/global/common/error/code/team';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { teamId, usernames, role } = req.body as InviteMemberProps;
    await connectToDatabase();
    const { tmbId } = await authCert({ req, authToken: true });
    await authTeamRole({ teamId, tmbId, role: TeamMemberRoleEnum.owner });

    let userMap: InviteMemberResponse = {
      invite: [],
      inValid: [],
      inTeam: []
    };

    // auth username valid
    for await (const username of usernames) {
      const user = await authUserExist({ username });
      if (!user || username === 'root') {
        userMap.inValid.push(username);
        continue;
      }

      const exit = await authMemberExistTeam({ userId: user._id, teamId });
      if (exit) {
        userMap.inTeam.push(username);
        continue;
      }
      userMap.invite.push(user._id);
    }

    // insert teamMember and send inform
    if (userMap.invite.length > 0) {
      const { maxSize, memberAmount } = await authTeamMaxMember(teamId);
      if (memberAmount + userMap.invite.length > maxSize) {
        throw new Error(TeamErrEnum.teamOverSize);
      }

      await MongoTeamMember.insertMany(
        userMap.invite.map((userId) => {
          return {
            userId,
            teamId,
            role: role,
            status: TeamMemberStatusEnum.waiting
          };
        })
      );
    }

    jsonRes(res, {
      data: userMap
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
