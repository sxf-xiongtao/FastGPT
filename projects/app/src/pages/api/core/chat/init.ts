import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { connectToDatabase } from '@/service/mongo';
import axios from 'axios';
import { getUserTeamsTags, getTeamsInfo } from '@/service/support/user/teamTags/controller';
import { MongoChatItem } from '@fastgpt/service/core/chat/chatItemSchema';
import { MongoApp } from '@fastgpt/service/core/app/schema';

type userInfoType = {
  data: {
    userId: string;
    tagsList: Array<string>;
  };
};

export function appsShema2appsType(data: any) {
  return {
    userId: String(data._id),
    teamId: String(data.teamId._id),
    tmbId: String(data.tmbId._id),
    name: data.name,
    type: data.type,
    simpleTemplateId: data.simpleTemplateId,
    avatar: data.avatar,
    intro: data.intro,
    updateTime: new Date(data.updateTime),
    modules: data.modules,
    inited: data.inited,
    permission: data.permission,
    teamTags: data.teamTags
  };
}
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();
    //
    const { teamId, autoken } = req.query as {
      teamId: string;
      autoken: string;
    };
    const teamInfo = await getTeamsInfo(teamId);
    const tagsUrl = teamInfo?.tagsUrl as never;
    const userInfo: userInfoType = await axios.get(tagsUrl + `/getUseInfor?autoken=${autoken}`);

    const { tagsList, userId = '' } = userInfo.data;
    if (!userId) {
      throw new Error('暂无你的用户信息');
    }
    // 获取相应的
    const query = {
      teamId: teamId,
      teamTags: { $in: tagsList }
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

function extractString(str: string) {
  const regex = /"(.*?)"/;
  const match = str.match(regex);

  if (match) {
    return match[1];
  } else {
    return '';
  }
}
