import React from 'react';
import { Box, Button, HStack, Input, ModalBody, ModalFooter, Switch } from '@chakra-ui/react';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import type { SystemPluginTemplateItemType } from '@fastgpt/global/core/workflow/type';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useFieldArray, useForm } from 'react-hook-form';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import MyNumberInput from '@fastgpt/web/components/common/Input/NumberInput/index';
import { putUpdateSystemPlugin } from '@/web/core/app/plugin/api';
import { FlowNodeTemplateTypeEnum } from '@fastgpt/global/core/workflow/constants';

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
  templateType: FlowNodeTemplateTypeEnum.other,
  customWorkflow: '',
  isTool: false,
  isActive: false,
  inputConfig: []
};

type FormType = {
  isActive: boolean;
  originCost: number;
  currentCost: number;
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
  const { register, setValue, control, watch, handleSubmit } = useForm<FormType>({
    defaultValues: plugin
  });
  const originCost = watch('originCost');

  const { fields: inputs } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormProvider)
    name: 'inputConfig' // unique name for your Field Array
  });

  const { runAsync: onSubmit, loading } = useRequest2(
    async (e: FormType) => {
      return putUpdateSystemPlugin({
        pluginId: plugin.id,
        isActive: e.isActive,
        originCost: e.originCost,
        currentCost: e.currentCost,
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
          <Box flex={1}>是否启用</Box>
          <Switch {...register('isActive')} />
        </HStack>
        <Box mt={5}>
          <HStack>
            <Box position={'relative'}>价格（n 积分/次）</Box>
          </HStack>
          <Box mt={1}>
            <MyNumberInput
              value={originCost ?? 0}
              onChange={(e) => setValue('originCost', e ?? 0)}
              step={0.01}
            />
          </Box>
        </Box>
        {inputs?.map((item, i) => (
          <Box key={item.key} mt={5}>
            <HStack>
              <Box position={'relative'}>
                <Box position={'absolute'} color={'red.600'} left={'-2'} top={'-1'}>
                  *
                </Box>
                {item.label}
              </Box>
              {item.description && <QuestionTip label={item.description} />}
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
