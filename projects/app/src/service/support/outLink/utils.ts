import { ChatItemValueTypeEnum, ChatRoleEnum } from '@fastgpt/global/core/chat/constants';
import { UserChatItemValueItemType } from '@fastgpt/global/core/chat/type';
import { DispatchNodeResponseKeyEnum } from '@fastgpt/global/core/workflow/runtime/constants';
import {
  getWorkflowEntryNodeIds,
  getMaxHistoryLimitFromNodes,
  initWorkflowEdgeStatus,
  storeNodes2RuntimeNodes
} from '@fastgpt/global/core/workflow/runtime/utils';
import { OutlinkAppType, OutLinkSchema } from '@fastgpt/global/support/outLink/type';
import { getAppLatestVersion } from '@fastgpt/service/core/app/controller';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { getChatItems } from '@fastgpt/service/core/chat/controller';
import { saveChat } from '@fastgpt/service/core/chat/saveChat';
import { dispatchWorkFlow } from '@fastgpt/service/core/workflow/dispatch';
import { getUserChatInfoAndAuthTeamPoints } from '@fastgpt/service/support/permission/auth/team';
import { NextApiResponse } from 'next';
import { authOutLinkLimit } from './auth';
import { addOutLinkUsage } from '@fastgpt/service/support/outLink/tools';
import { pushChatUsage } from '../wallet/usage/push';
import { addLog } from '@fastgpt/service/common/system/log';
import { getErrText } from '@fastgpt/global/common/error/utils';
import { getUsageSourceByPublishChannel } from '@fastgpt/global/support/wallet/usage/tools';
import { getChatSourceByPublishChannel } from '@fastgpt/global/core/chat/utils';

export type outLinkInvokeChatProps<T extends OutlinkAppType> = {
  shareChat: OutLinkSchema<T>;
  chatId: string; // specific chat
  userQuestion: string;
  res?: NextApiResponse;
  messageId: string;
  replyCallback: (replyContent: string) => Promise<any>;
};

export async function outlinkInvokeChat<T extends OutlinkAppType>({
  shareChat,
  chatId,
  userQuestion,
  res,
  messageId,
  replyCallback
}: outLinkInvokeChatProps<T>) {
  try {
    // Get app workflow config
    const [app, { nodes, chatConfig, edges }, { user }] = await Promise.all([
      MongoApp.findById(shareChat.appId).lean(),
      getAppLatestVersion(shareChat.appId),
      getUserChatInfoAndAuthTeamPoints(shareChat.tmbId)
    ]);

    if (!nodes || !user || !chatConfig || !app) {
      return Promise.reject('Invalid chat');
    }

    const { histories } = await getChatItems({
      appId: shareChat.appId,
      chatId,
      limit: getMaxHistoryLimitFromNodes(nodes),
      field: `dataId obj value`
    });

    // dedupe
    if (histories.find((item) => item.dataId === messageId)) {
      return; // dupelicated messaage, do noting
    }

    await authOutLinkLimit({
      outLinkUid: messageId,
      outLink: shareChat as any, // HACK, we do not need to provide app: T
      question: userQuestion,
      ip: chatId
    });

    const dispatchQuery: UserChatItemValueItemType[] = [
      {
        type: ChatItemValueTypeEnum.text,
        text: {
          content: userQuestion
        }
      }
    ];

    const { assistantResponses, newVariables, flowResponses, flowUsages } = await dispatchWorkFlow({
      res,
      mode: 'chat',
      teamId: shareChat.teamId,
      tmbId: shareChat.tmbId,
      user,
      app,
      chatId,
      variables: {},
      histories,
      query: dispatchQuery,
      chatConfig,
      stream: false,
      detail: false,
      runtimeEdges: initWorkflowEdgeStatus(edges),
      runtimeNodes: storeNodes2RuntimeNodes(nodes, getWorkflowEntryNodeIds(nodes)),
      maxRunTimes: 200
    });

    const responseContent = assistantResponses
      .map((response) => {
        return response.text?.content;
      })
      .filter(Boolean)
      .join('\n');

    await saveChat({
      chatId,
      appId: app._id,
      teamId: shareChat.teamId,
      tmbId: shareChat.tmbId,
      nodes,
      appChatConfig: chatConfig,
      variables: newVariables,
      isUpdateUseTime: true, // owner update use time
      newTitle: userQuestion.slice(0, 8),
      shareId: shareChat.shareId,
      source: getChatSourceByPublishChannel(shareChat.type),
      content: [
        {
          dataId: messageId,
          obj: ChatRoleEnum.Human,
          value: dispatchQuery
        },
        {
          obj: ChatRoleEnum.AI,
          value: assistantResponses,
          [DispatchNodeResponseKeyEnum.nodeResponse]: flowResponses
        }
      ],
      metadata: {
        chatId
      }
    });

    await replyCallback(responseContent);

    const { totalPoints } = pushChatUsage({
      appName: app.name,
      appId: app._id,
      teamId: shareChat.teamId,
      tmbId: shareChat.tmbId,
      source: getUsageSourceByPublishChannel(shareChat.type),
      flowUsages
    });

    await addOutLinkUsage({
      shareId: shareChat.shareId,
      totalPoints: totalPoints
    });
  } catch (error) {
    addLog.error('Outlink app chat error', error);
    await replyCallback(`App run error: ${getErrText(error)} `);
  }
}
