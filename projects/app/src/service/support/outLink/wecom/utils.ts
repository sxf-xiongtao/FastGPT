import { decrypt } from '@wecom/crypto';
import { XMLParser } from 'fast-xml-parser';

const Parser = new XMLParser();

export async function parseBody<T>(
  raw: string,
  AesKey: string
): Promise<
  {
    toUserName: string;
    AgentID: string;
  } & T
> {
  const { xml: body } = await Parser.parse(raw);
  const Encrypt = body.Encrypt as string;
  const { message, id, random } = decrypt(AesKey, Encrypt);
  const { xml: data } = await Parser.parse(message);

  return {
    toUserName: data.ToUserName,
    AgentID: data.AgentID,
    ID: id,
    Random: random,
    ...data
  };
}
