import { MongoUserInform } from './schema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import type { SendInform2AllProps, SendInformProps } from './type';
import { sendMessage } from './sendMessage';
import { getMessageTemplate } from './constants';
import type { InformLevelEnum } from '@fastgpt/global/support/user/inform/constants';
import { checkTimerLock } from '@fastgpt/service/common/system/timerLock/utils';
import { startSendInform } from '@/service/queue/sendInform';
import { getErrText } from '@fastgpt/global/common/error/utils';
import type { SendInformTemplateCodeEnum } from '@fastgpt/global/support/user/inform/constants';

export async function sendInform2AllUser({ title, content, level }: SendInform2AllProps) {
  const users = await MongoUser.find({}, '_id');

  for await (const user of users) {
    try {
      await sendInform2OneUser({
        userId: user._id,
        level,
        templateCode: 'CUSTOM',
        templateParam: { title, content }
      });
    } catch (error) {}
  }
}

export async function sendInform2OneUser<
  Level extends InformLevelEnum,
  Key extends SendInformTemplateCodeEnum
>({
  teamId,
  userId,
  level,
  templateCode,
  templateParam,
  customLockMinutes
}: SendInformProps<Level, Key>): Promise<{
  success: boolean;
  message?: string;
}> {
  async function getTeam(teamId?: string, userId?: string) {
    if (teamId) {
      return await MongoTeam.findById(teamId).lean();
    } else if (userId) {
      return await MongoTeam.findOne({ ownerId: userId }).lean();
    } else {
      return Promise.reject('teamId or userId is required');
    }
  }

  const team = await getTeam(teamId, userId);

  if (!team)
    return {
      success: false,
      message: 'Can not find team'
    };

  const { getInformTemplate, lockMinutes, isSendQueue } = getMessageTemplate(templateCode);

  // Check lock
  const timerId = `inform--${templateCode}--${userId}`;

  const isLock = !(await checkTimerLock({
    timerId,
    lockMinuted: customLockMinutes ?? lockMinutes
  }));
  if (isLock) {
    return {
      success: false,
      message: '发送通知太频繁了'
    };
  }

  const onSendEmergency = async () => {
    // 紧急通知，发送短信/邮件
    if (level === 'emergency') {
      if (!teamId) {
        throw new Error('紧急通知必须提供 teamId');
      }
      await sendMessage({
        teamId: teamId,
        templateCode,
        templateParam
      });
    }
  };
  const onCreateInform = async () => {
    // Create inform
    if (getInformTemplate) {
      await MongoUserInform.create({
        level,
        userId: userId,
        ...(teamId ? { teamId } : {}),
        ...getInformTemplate({ name: team.name, ...templateParam })
      });
    }
  };

  if (isSendQueue) {
    global.sendInformQueue.push(onSendEmergency);
    global.sendInformQueue.push(onCreateInform);
    startSendInform();

    return {
      success: true
    };
  }

  try {
    await onSendEmergency();
    await onCreateInform();
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      message: getErrText(error)
    };
  }
}
