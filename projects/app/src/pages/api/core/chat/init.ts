import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import axios from 'axios';
import { getUserTeamsTags, getTeamsInfo } from '@/service/support/user/teamTags/controller';
import { MongoChatItem } from '@fastgpt/service/core/chat/chatItemSchema';
import { MongoApp } from '@fastgpt/service/core/app/schema';

type userInfoType = {
  data: {
    uid: string;
    tags: Array<string>;
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    //
    const { shareTeamId, authToken } = req.body as {
      shareTeamId: string;
      authToken: string;
    };
    if (shareTeamId) {
      throw new Error('search Error');
    }
    const teamInfo = await getTeamsInfo(shareTeamId);
    if (teamInfo && teamInfo.tagsUrl) {
      throw new Error('search Error');
    }
    const tagsUrl = teamInfo?.tagsUrl;
    const { data: userInfo }: { data: userInfoType } = await axios.post(tagsUrl + `/getUserInfo`, {
      autoken: authToken
    });

    const { tags, uid = '' } = userInfo?.data;
    if (!uid) {
      throw new Error('暂无你的用户信息');
    }
    // 获取相应的
    const query = {
      teamId: shareTeamId,
      teamTags: { $in: tags },
      uid: uid
    };

    // 执行查询
    const apps = await MongoApp.find(query);
    if (apps.length <= 0) {
      throw new Error('无可用的应用，请联系管理员');
    }

    jsonRes(res, {
      data: {
        apps,
        teamInfo
      }
    });
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
