import { MongoUserInform } from './schema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import type { SendInformProps } from '@fastgpt/global/support/user/inform/type';
import { delay } from '@fastgpt/global/common/system/utils';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';

export async function sendInform2AllUser({ title, content, level }: SendInformProps) {
  const users = await MongoUser.find({}, '_id');
  await MongoUserInform.insertMany(
    users.map(({ _id }) => ({
      level,
      title,
      content,
      userId: _id,
      active: true
    }))
  );
}

export async function sendInform2OneUser({
  title,
  content,
  tmbId,
  level
}: SendInformProps & { tmbId: string }) {
  const tmb = await MongoTeamMember.findById(tmbId, 'userId');
  if (!tmb) return;
  // random delay 500ms ~ 5s
  await delay(Math.random() * 4500 + 500);
  const inform = await MongoUserInform.findOne({
    title,
    content,
    userId: tmb.userId,
    time: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
  });

  if (inform) return;

  await MongoUserInform.create({
    level,
    title,
    content,
    userId: tmb.userId
  });
}
