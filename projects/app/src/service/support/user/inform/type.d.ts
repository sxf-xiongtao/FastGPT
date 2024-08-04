import {
  InformLevelEnum,
  SendInformTemplateCodeEnum
} from '@fastgpt/global/support/user/inform/constants';
import { MessageTemplateParamsType } from './constants';

type _sendInformProps<
  Key extends SendInformTemplateCodeEnum | undefined,
  Level extends InformLevelEnum
> = {
  teamId: string;
  level: `${Level}`;
  templateCode: `${Key}`;
  templateParam: Key extends undefined ? undefined : MessageTemplateParamsType<NonNullable<Key>>;
  customLockMinutes?: number; // custom lock minutes
};

// when level is emergency, templateCode and templateParam are required, and title and content are optional
export type SendInformProps<
  Level extends InformLevelEnum,
  Key extends SendInformTemplateCodeEnum | undefined = undefined
> = _sendInformProps<Key, Level>;

export type SendInform2AllProps = {
  title: string;
  content: string;
  level: `${InformLevelEnum}`;
};
