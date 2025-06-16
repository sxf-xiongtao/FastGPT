import {
  ChatFileTypeEnum,
  ChatItemValueTypeEnum,
  ChatRoleEnum
} from '@fastgpt/global/core/chat/constants';
import { UserChatItemValueItemType } from '@fastgpt/global/core/chat/type';
import { DispatchNodeResponseKeyEnum } from '@fastgpt/global/core/workflow/runtime/constants';
import {
  getWorkflowEntryNodeIds,
  getMaxHistoryLimitFromNodes,
  storeEdges2RuntimeEdges,
  storeNodes2RuntimeNodes
} from '@fastgpt/global/core/workflow/runtime/utils';
import { OutlinkAppType, OutLinkSchema } from '@fastgpt/global/support/outLink/type';
import { getAppLatestVersion } from '@fastgpt/service/core/app/version/controller';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { getChatItems } from '@fastgpt/service/core/chat/controller';
import { saveChat } from '@fastgpt/service/core/chat/saveChat';
import { dispatchWorkFlow } from '@fastgpt/service/core/workflow/dispatch';
import { getUserChatInfoAndAuthTeamPoints } from '@fastgpt/service/support/permission/auth/team';
import { NextApiResponse } from 'next';
import { authOutLinkLimit } from './auth';
import { addOutLinkUsage } from '@fastgpt/service/support/outLink/tools';
import { createChatUsage } from '@fastgpt/service/support/wallet/usage/controller';
import { addLog } from '@fastgpt/service/common/system/log';
import { getErrText } from '@fastgpt/global/common/error/utils';
import { getUsageSourceByPublishChannel } from '@fastgpt/global/support/wallet/usage/tools';
import { getChatSourceByPublishChannel } from '@fastgpt/global/core/chat/utils';
import { WORKFLOW_MAX_RUN_TIMES } from '@fastgpt/service/core/workflow/constants';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';
import { MongoChat } from '@fastgpt/service/core/chat/chatSchema';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import { MongoChatItem } from '@fastgpt/service/core/chat/chatItemSchema';
import { removeDatasetCiteText } from '@fastgpt/service/core/ai/utils';

// 新开历史记录, 把原来 chatId 替换
const RESET_CHAT_INPUT = 'Reset';
const RESET_CHAT_REPLY = 'The chat records have been reset';
export const resetChat = ({ appId, chatId }: { appId: string; chatId: string }) => {
  const newChatId = getNanoid(26);
  return mongoSessionRun(async (session) => {
    await MongoChat.updateOne(
      {
        appId,
        chatId
      },
      {
        $set: {
          chatId: newChatId
        }
      },
      { session }
    );
    await MongoChatItem.updateMany(
      {
        appId,
        chatId
      },
      {
        $set: {
          chatId: newChatId
        }
      },
      { session }
    );
  });
};

export type outLinkInvokeChatProps<T extends OutlinkAppType> = {
  outLinkConfig: OutLinkSchema<T>;
  chatId: string; // specific chat
  userQuestion: string;
  imgUrl?: string;
  res?: NextApiResponse;
  messageId: string;
  chatUserId: string;
  replyCallback: (replyContent: string) => Promise<any>;
};
const DEFAULT_REPLY = 'This is default reply';

export async function outlinkInvokeChat<T extends OutlinkAppType>({
  outLinkConfig,
  chatId,
  userQuestion,
  imgUrl,
  res,
  messageId,
  chatUserId,
  replyCallback
}: outLinkInvokeChatProps<T>) {
  try {
    // Get app workflow config
    const [app, { nodes, chatConfig, edges }, { timezone, externalProvider }] = await Promise.all([
      MongoApp.findById(outLinkConfig.appId).lean(),
      getAppLatestVersion(outLinkConfig.appId),
      getUserChatInfoAndAuthTeamPoints(outLinkConfig.tmbId)
    ]);

    if (!nodes || !chatConfig || !app) {
      return Promise.reject('Invalid chat');
    }

    // Check whether the chatId is valid
    if (userQuestion === RESET_CHAT_INPUT) {
      await resetChat({ appId: outLinkConfig.appId, chatId });
      await replyCallback(RESET_CHAT_REPLY);
      return;
    }

    const { histories } = await getChatItems({
      appId: outLinkConfig.appId,
      chatId,
      offset: 0,
      limit: getMaxHistoryLimitFromNodes(nodes),
      field: `dataId obj value`
    });

    // dedupe
    if (histories.find((item) => item.dataId === messageId)) {
      return; // dupelicated messaage, do noting
    }

    await authOutLinkLimit({
      outLinkUid: chatUserId,
      outLink: outLinkConfig as any, // HACK, we do not need to provide app: T
      question: userQuestion,
      ip: chatId
    });

    const dispatchQuery: UserChatItemValueItemType[] = [
      {
        type: ChatItemValueTypeEnum.text,
        text: {
          content: userQuestion
        }
      },
      ...(imgUrl
        ? [
            {
              type: ChatItemValueTypeEnum.file as const,
              file: {
                type: ChatFileTypeEnum.image,
                name: '',
                url: imgUrl
              }
            }
          ]
        : [])
    ];

    const {
      assistantResponses,
      newVariables,
      flowResponses,
      flowUsages,
      durationSeconds,
      system_memories
    } = await dispatchWorkFlow({
      res,
      mode: 'chat',
      runningAppInfo: {
        id: String(app._id),
        teamId: app.teamId,
        tmbId: app.tmbId
      },
      runningUserInfo: {
        teamId: outLinkConfig.teamId,
        tmbId: outLinkConfig.tmbId
      },
      uid: chatUserId || outLinkConfig.tmbId,
      timezone,
      externalProvider,
      chatId,
      variables: {},
      histories,
      query: dispatchQuery,
      chatConfig,
      stream: false,
      runtimeEdges: storeEdges2RuntimeEdges(edges),
      runtimeNodes: storeNodes2RuntimeNodes(nodes, getWorkflowEntryNodeIds(nodes)),
      maxRunTimes: WORKFLOW_MAX_RUN_TIMES
    });

    // Format results
    let responseContent = assistantResponses
      .map((response) => {
        return response.text?.content;
      })
      .filter(Boolean)
      .join('\n')
      .trim();
    if (responseContent.length === 0) {
      responseContent = DEFAULT_REPLY;
    }
    // Remove quote references like [id](CITE)
    responseContent = removeDatasetCiteText(responseContent, false);

    const replyResult = await (async () => {
      try {
        const result = await replyCallback(responseContent);

        if (result.errcode !== 0) {
          addLog.error(`[Official account] reply error`, {
            errmsg: result.errmsg
          });
          return {
            success: false,
            errmsg: result.errmsg
          };
        }

        addLog.debug(`[Official account] reply success`, {
          responseContent,
          result
        });
        return {
          success: true,
          data: result
        };
      } catch (error) {
        addLog.error(`[Official account] reply error`, error);
        return {
          success: false,
          errmsg: getErrText(error)
        };
      }
    })();

    // Save and reply
    await saveChat({
      chatId,
      appId: app._id,
      teamId: outLinkConfig.teamId,
      tmbId: outLinkConfig.tmbId,
      outLinkUid: chatUserId,
      nodes,
      appChatConfig: chatConfig,
      variables: newVariables,
      isUpdateUseTime: true, // owner update use time
      newTitle: userQuestion.slice(0, 8),
      shareId: outLinkConfig.shareId,
      source: getChatSourceByPublishChannel(outLinkConfig.type),
      sourceName: outLinkConfig.name,
      content: [
        {
          dataId: messageId,
          obj: ChatRoleEnum.Human,
          value: dispatchQuery
        },
        {
          obj: ChatRoleEnum.AI,
          value: assistantResponses,
          [DispatchNodeResponseKeyEnum.nodeResponse]: flowResponses,
          memories: system_memories
        }
      ],
      metadata: {},
      durationSeconds,
      errorMsg: replyResult.success ? undefined : replyResult.errmsg
    });

    // Create usage
    const { totalPoints } = createChatUsage({
      appName: app.name,
      appId: app._id,
      teamId: outLinkConfig.teamId,
      tmbId: outLinkConfig.tmbId,
      source: getUsageSourceByPublishChannel(outLinkConfig.type),
      flowUsages
    });
    addOutLinkUsage({
      shareId: outLinkConfig.shareId,
      totalPoints: totalPoints
    });
  } catch (error) {
    addLog.error('[Official account] response error', error);
    await replyCallback(`App run error: ${getErrText(error)}`);
  }
}
