import { Inform } from '../mongo';

export async function sendInform2User(data: {
  userId: string;
  type: string;
  title: string;
  content: string;
}) {
  try {
    await Inform.create(data);
  } catch (error) {}
}
