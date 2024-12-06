import React from 'react';
import { Box, Button, HStack, Input, ModalBody, ModalFooter, Switch } from '@chakra-ui/react';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import type { SystemPluginTemplateItemType } from '@fastgpt/global/core/workflow/type';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useFieldArray, useForm } from 'react-hook-form';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import { FlowNodeTemplateTypeEnum } from '@fastgpt/global/core/workflow/constants';
import MyNumberInput from '@fastgpt/web/components/common/Input/NumberInput';
import { putUpdatePlugin } from '@/web/core/app/plugin/api';

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
  customWorkflow: '',
  isTool: false,
  isActive: false,
  inputConfig: [],
  pluginOrder: 0
};

type FormType = {
  isActive: boolean;
  originCost: number;
  currentCost: number;
  hasTokenFee: boolean;
  inputConfig: SystemPluginTemplateItemType['inputConfig'];
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
  const { register, control, handleSubmit, setValue, watch } = useForm<FormType>({
    defaultValues: plugin
  });
  const currentCost = watch('currentCost');

  const { fields: inputs } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormProvider)
    name: 'inputConfig' // unique name for your Field Array
  });

  const { runAsync: onSubmit, loading } = useRequest2(
    async (e: FormType) => {
      return putUpdatePlugin({
        pluginId: plugin.id,
        isActive: e.isActive,
        originCost: e.originCost,
        currentCost: e.currentCost,
        hasTokenFee: e.hasTokenFee,
        inputConfig: e.inputConfig
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
        {inputs?.map((item, i) => (
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
              <Input bg={'myGray.50'} {...register(`inputConfig.${i}.value`, { required: true })} />
            </Box>
          </Box>
        ))}
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
