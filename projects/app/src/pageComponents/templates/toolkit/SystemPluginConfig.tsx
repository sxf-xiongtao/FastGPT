import React, { useCallback } from 'react';
import { Box, Button, HStack, Input, ModalBody, ModalFooter, Switch } from '@chakra-ui/react';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useForm } from 'react-hook-form';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import { FlowNodeTemplateTypeEnum } from '@fastgpt/global/core/workflow/constants';
import MyNumberInput from '@fastgpt/web/components/common/Input/NumberInput';
import { putUpdatePlugin } from '@/web/core/app/plugin/api';
import type { SystemPluginTemplateItemType } from '@fastgpt/global/core/app/plugin/type';

const defaultPlugin: SystemPluginTemplateItemType = {
  id: '',
  name: '',
  avatar: '',
  version: '',
  workflow: {
    nodes: [],
    edges: []
  },
  originCost: 0,
  currentCost: 0,
  hasTokenFee: false,
  templateType: FlowNodeTemplateTypeEnum.other,
  isActive: false,
  pluginOrder: 0
};

type FormType = {
  isActive: boolean;
  originCost: number;
  currentCost: number;
  hasTokenFee: boolean;
  inputListVal: Record<string, any>;
};

const SystemPluginConfig = ({
  plugin = defaultPlugin,
  onSuccess,
  onClose
}: {
  plugin: SystemPluginTemplateItemType;
  onSuccess: () => void;
  onClose: () => void;
}) => {
  const { register, handleSubmit, setValue, watch } = useForm<FormType>({
    defaultValues: plugin
  });
  const currentCost = watch('currentCost');

  const { runAsync: onSubmit, loading } = useRequest2(
    async (e: FormType) => {
      return putUpdatePlugin({
        pluginId: plugin.id,
        isActive: e.isActive,
        originCost: e.originCost,
        currentCost: e.currentCost,
        hasTokenFee: e.hasTokenFee,
        inputListVal: e.inputListVal
      }).then(onSuccess);
    },
    {
      successToast: '配置成功',
      onSuccess() {
        onClose();
      }
    }
  );

  return (
    <MyModal isOpen title={`${plugin?.name}配置`} iconSrc={plugin.avatar} onClose={onClose}>
      <ModalBody>
        <HStack>
          <Box flex={1} fontSize={'sm'} fontWeight={'medium'}>
            是否启用
          </Box>
          <Switch {...register('isActive')} />
        </HStack>
        <HStack mt={5}>
          <Box flex={1} fontSize={'sm'} fontWeight={'medium'}>
            是否收取 Token 费用
          </Box>
          <Switch {...register('hasTokenFee')} />
        </HStack>
        <HStack mt={5}>
          <Box flex={1} fontSize={'sm'} fontWeight={'medium'}>
            调用价格 (n积分/次)
          </Box>
          <MyNumberInput
            value={currentCost ?? 0}
            onChange={(e) => setValue('currentCost', e ?? 0)}
            max={1000}
            min={0}
            step={0.1}
            ml={8}
          />
        </HStack>
        {plugin?.inputList?.map((item, i) => {
          if (item.inputType === 'switch') {
            return (
              <Box key={item.key} mt={5}>
                <HStack>
                  <Box position={'relative'} fontSize={'sm'} fontWeight={'medium'}>
                    <Box position={'absolute'} color={'red.600'} left={'-2'} top={'-1'}>
                      *
                    </Box>
                    {item.label}
                  </Box>
                  {item.description && <QuestionTip label={item.description} pt={1} />}
                </HStack>
                <Box mt={1}>
                  <Switch {...register(`inputListVal.${item.key}`)} />
                </Box>
              </Box>
            );
          } else {
            return (
              <Box key={item.key} mt={5}>
                <HStack>
                  <Box position={'relative'} fontSize={'sm'} fontWeight={'medium'}>
                    <Box position={'absolute'} color={'red.600'} left={'-2'} top={'-1'}>
                      *
                    </Box>
                    {item.label}
                  </Box>
                  {item.description && <QuestionTip label={item.description} pt={1} />}
                </HStack>
                <Box mt={1}>
                  <Input
                    bg={'myGray.50'}
                    {...register(`inputListVal.${item.key}`, { required: true })}
                  />
                </Box>
              </Box>
            );
          }
        })}
      </ModalBody>
      <ModalFooter>
        <Button isLoading={loading} onClick={handleSubmit(onSubmit)}>
          确认
        </Button>
      </ModalFooter>
    </MyModal>
  );
};

export default SystemPluginConfig;
