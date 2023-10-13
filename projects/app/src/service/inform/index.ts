import { MongoInform } from '@/service/models/inform';

export async function sendInform2User(data: {
  userId: string;
  type: string;
  title: string;
  content: string;
}) {
  try {
    await MongoInform.create(data);
  } catch (error) {}
}
