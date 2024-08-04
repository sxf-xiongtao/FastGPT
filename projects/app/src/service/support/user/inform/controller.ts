import { MongoUserInform } from './schema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { SendInform2AllProps, SendInformProps } from './type';
import { sendMessage } from './sendMessage';
import { getMessageTemplate } from './constants';
import { InformLevelEnum } from '@fastgpt/global/support/user/inform/constants';
import { checkTimerLock } from '@fastgpt/service/common/system/timerLock/utils';
import { startSendInform } from '@/service/queue/sendInform';
import { getErrText } from '@fastgpt/global/common/error/utils';
import { SendInformTemplateCodeEnum } from '@fastgpt/global/support/user/inform/constants';

export async function sendInform2AllUser({ title, content, level }: SendInform2AllProps) {
  const teams = await MongoTeam.find({}, '_id');

  for await (const team of teams) {
    try {
      await sendInform2OneUser({
        teamId: team._id,
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
  level,
  templateCode,
  templateParam,
  customLockMinutes
}: SendInformProps<Level, Key>): Promise<{
  success: boolean;
  message?: string;
}> {
  const team = await MongoTeam.findById(teamId).lean();

  if (!team)
    return {
      success: false,
      message: 'Can not find team'
    };

  const { getInformTemplate, lockMinutes, isSendQueue } = getMessageTemplate(templateCode);

  // Check lock
  const timerId = `inform--${templateCode}--${teamId}`;
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

  const onSend = async () => {
    // 紧急通知，发送短信/邮件
    if (level === 'emergency') {
      await sendMessage({
        teamId,
        templateCode,
        templateParam
      });
    }
    // Create inform
    if (getInformTemplate) {
      await MongoUserInform.create({
        level,
        userId: team.ownerId,
        ...getInformTemplate({ name: team.name, ...templateParam })
      });
    }
  };

  if (isSendQueue) {
    global.sendInformQueue.push(onSend);
    startSendInform();

    return {
      success: true
    };
  }

  try {
    await onSend();
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
