import { Box, Button, Flex, Input, Textarea } from '@chakra-ui/react';
import React from 'react';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import { useRequest } from '@fastgpt/web/hooks/useRequest';
import { serviceSideProps } from '@/web/common/i18n';
import {
  getSystemMsgModal,
  postSendSystemMsg,
  postUpdateSystemMsgModal
} from '@/web/common/system/api';
import { useForm } from 'react-hook-form';
import { SendInformProps } from '@fastgpt/global/support/user/inform/type';
import { useQuery } from '@tanstack/react-query';
import MySelect from '@fastgpt/web/components/common/MySelect';
import { InformLevelEnum } from '@fastgpt/global/support/user/inform/constants';

const InformSetting = () => {
  const { ConfirmModal: ConfirmSettingSystemModal, openConfirm: onOpenConfirmSystemModal } =
    useConfirm({
      content: '确认修改系统公告？'
    });
  const { ConfirmModal: ConfirmSendSystemMsg, openConfirm: onOpenConfirmSendSystemMsg } =
    useConfirm({
      content: '确认发送系统通知？'
    });

  const {
    register: registerSystemMsgModal,
    handleSubmit: handleSubmitUpdateSystemMsgModal,
    reset: resetUpdateSystemMsgModal
  } = useForm({
    defaultValues: {
      content: ''
    }
  });
  const {
    getValues,
    setValue,
    register: registerSystemInform,
    handleSubmit: handleSubmitSendSystemInform,
    watch
  } = useForm({
    defaultValues: {
      level: InformLevelEnum.common,
      title: '',
      content: ''
    }
  });
  const informLevel = watch('level');

  const { mutate: onUpdateSystemModal, isLoading: isUpdatingSystemModal } = useRequest({
    mutationFn: (data: { content: string }) => {
      return postUpdateSystemMsgModal(data);
    },
    successToast: '修改成功',
    errorToast: '修改失败'
  });
  const { mutate: onUpdateSendSystemMsg, isLoading: isUpdatingSendSystemMsg } = useRequest({
    mutationFn: (data: SendInformProps) => {
      return postSendSystemMsg(data);
    },
    successToast: '发送成功',
    errorToast: '发送失败'
  });

  useQuery(['getSystemMsgModal'], getSystemMsgModal, {
    onSuccess(res) {
      resetUpdateSystemMsgModal({
        content: res?.content || ''
      });
    }
  });

  return (
    <Box>
      <Box>
        <Flex alignItems={'flex-start'}>
          <Box fontSize={'2xl'}>系统公告配置</Box>
          <Button
            variant={'whitePrimary'}
            size={'sm'}
            ml={2}
            isLoading={isUpdatingSystemModal}
            onClick={handleSubmitUpdateSystemMsgModal((data) =>
              onOpenConfirmSystemModal(() => onUpdateSystemModal(data))()
            )}
          >
            保存
          </Button>
        </Flex>
        <Box py={2}>
          设置该内容，会在用户登录系统后，通过弹窗形式进行强提示。用户关闭后，下次不再提示。只能设置1个该类型通知。支持
          markdown 个格式。
        </Box>
        <Textarea rows={10} {...registerSystemMsgModal('content', {})} />
      </Box>
      <Box mt={8}>
        <Flex alignItems={'flex-start'}>
          <Box fontSize={'2xl'}>发送系统通知</Box>
          <Button
            variant={'whitePrimary'}
            size={'sm'}
            ml={2}
            isLoading={isUpdatingSendSystemMsg}
            onClick={handleSubmitSendSystemInform((data) =>
              onOpenConfirmSendSystemMsg(() => onUpdateSendSystemMsg(data))()
            )}
          >
            确认发送
          </Button>
        </Flex>
        <Box py={2}>为所有用户发送一个通知，不同等级通知，会有不同提示。</Box>
        <Flex alignItems={'center'}>
          <Box flex={'0 0 100px'} mr={2}>
            消息等级
          </Box>
          <MySelect
            list={[
              { label: '一般(仅发站内信)', value: InformLevelEnum.common },
              { label: '重要（站内信+登录通知）', value: InformLevelEnum.important },
              { label: '紧急（站内信+登录通知+邮件/短信提醒）', value: InformLevelEnum.emergency }
            ]}
            value={informLevel}
            onchange={(value) => setValue('level', value)}
          />
        </Flex>
        <Flex alignItems={'center'} mt={3}>
          <Box flex={'0 0 100px'} mr={2}>
            通知标题
          </Box>
          <Input
            placeholder="通知标题"
            {...registerSystemInform('title', {
              required: true
            })}
          ></Input>
        </Flex>
        <Textarea
          mt={2}
          rows={10}
          placeholder="通知内容"
          {...registerSystemInform('content', {
            required: true
          })}
        />
      </Box>
      <ConfirmSendSystemMsg />
      <ConfirmSettingSystemModal />
    </Box>
  );
};

export default InformSetting;

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content))
    }
  };
}
