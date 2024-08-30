import React, { useCallback, useMemo } from 'react';
import { FlowNodeTemplateTypeEnum } from '@fastgpt/global/core/workflow/constants';
import type { EditCustomPluginType } from '@/global/core/workflow/plugin/type.d';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  ModalBody,
  ModalFooter,
  Switch,
  Textarea
} from '@chakra-ui/react';
import MyModal from '@fastgpt/web/components/common/MyModal';
import MyNumberInput from '@fastgpt/web/components/common/Input/NumberInput';
import Avatar from '@fastgpt/web/components/common/Avatar';
import { useSelectFile } from '@fastgpt/web/common/file/hooks/useSelectFile';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { compressImgFileAndUpload } from '@/web/common/file/utils';
import { getErrText } from '@fastgpt/global/common/error/utils';
import { useTranslation } from 'next-i18next';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { getPluginTemplates } from '@/global/core/workflow/plugin/constants';
import MySelect from '@fastgpt/web/components/common/MySelect';
import MyIcon from '@fastgpt/web/components/common/Icon';
import {
  delCustomPlugin,
  postCreateCustomPlugin,
  putUpdateCustomPlugin
} from '@/web/core/app/plugin/api';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { WorkflowTemplateBasicType } from '@fastgpt/global/core/workflow/type';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';

export const defaultCustomPluginForm: EditCustomPluginType = {
  templateType: FlowNodeTemplateTypeEnum.tools,
  name: '',
  avatar: '',
  intro: '',
  isActive: true,
  weight: 10,
  originCost: 0,
  inputConfig: [],
  workflow: ''
};

const CustomPluginConfig = ({
  defaultForm = defaultCustomPluginForm,
  onSuccess,
  onClose
}: {
  defaultForm: EditCustomPluginType;
  onSuccess: () => void;
  onClose: () => void;
}) => {
  const isEdit = !!defaultForm.id;
  const { toast } = useToast();
  const { t } = useTranslation();

  const { register, setValue, control, watch, handleSubmit } = useForm({
    defaultValues: defaultForm
  });
  const name = watch('name');
  const originCost = watch('originCost');
  const weight = watch('weight');
  const avatar = watch('avatar');
  const templateType = watch('templateType');

  const pluginTypeSelectList = useMemo(
    () =>
      getPluginTemplates().map((item) => ({
        label: item.label,
        value: item.type
      })),
    []
  );

  const {
    fields: inputs,
    append: appendInput,
    remove: removeInput,
    update: updateInput
  } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormProvider)
    name: 'inputConfig' // unique name for your Field Array
  });
  const { File, onOpen: onOpenSelectFile } = useSelectFile({
    fileType: '.jpg,.png',
    multiple: false
  });

  const onSelectFile = useCallback(
    async (e: File[]) => {
      const file = e[0];
      if (!file) return;
      try {
        const src = await compressImgFileAndUpload({
          file,
          maxW: 300,
          maxH: 300
        });
        setValue('avatar', src);
      } catch (err: any) {
        toast({
          title: getErrText(err, t('common:common.error.Select avatar failed')),
          status: 'warning'
        });
      }
    },
    [setValue, t, toast]
  );

  const { runAsync: onSubmit, loading } = useRequest2(
    (data: EditCustomPluginType) => {
      const workflow = (() => {
        try {
          return JSON.parse(data.workflow) as WorkflowTemplateBasicType;
        } catch (error) {}
      })();

      if (!workflow) {
        return Promise.reject('工作流配置有误');
      }

      const formatData = {
        pluginId: defaultForm.id ? defaultForm.id : '',
        name: data.name,
        avatar: data.avatar,
        intro: data.intro,
        weight: data.weight,
        originCost: data.originCost,
        inputConfig: data.inputConfig.map((item) => ({
          key: item.key,
          label: item.key,
          description: item.key,
          value: item.value
        })),
        workflow,
        templateType: data.templateType,
        isActive: data.isActive
      };

      if (formatData.pluginId) {
        return putUpdateCustomPlugin(formatData);
      }

      return postCreateCustomPlugin(formatData);
    },
    {
      onSuccess: () => {
        toast({
          title: '配置成功',
          status: 'success'
        });
        onSuccess();
        onClose();
      },
      onError() {},
      refreshDeps: [defaultForm.id]
    }
  );

  const { ConfirmModal: DeleteConfirmModal, openConfirm: openDeleteConfirm } = useConfirm({
    type: 'delete',
    content: '确认删除该插件么？'
  });
  const { runAsync: onDelete, loading: isDeleting } = useRequest2(delCustomPlugin, {
    onSuccess() {
      toast({
        title: '删除成功',
        status: 'success'
      });
      onSuccess();
      onClose();
    }
  });

  return (
    <MyModal
      isCentered
      isOpen
      title={`${name || '自定义插件'}配置`}
      maxW={['90vw', '500px']}
      w={'100%'}
      h={'90vh'}
      iconSrc={avatar}
    >
      <ModalBody flex={1} overflow={'auto'}>
        {/* 头像 */}
        <Box color={'myGray.800'} fontWeight={'bold'}>
          {t('common:common.Set Name')}
        </Box>
        <Flex mt={2} alignItems={'center'}>
          <MyTooltip label={t('common:common.Set Avatar')}>
            <Avatar
              flexShrink={0}
              src={avatar}
              w={['28px', '36px']}
              h={['28px', '36px']}
              cursor={'pointer'}
              borderRadius={'md'}
              onClick={onOpenSelectFile}
            />
          </MyTooltip>
          <Input
            flex={1}
            ml={3}
            autoFocus
            bg={'myWhite.600'}
            {...register('name', {
              required: t('common:core.app.error.App name can not be empty')
            })}
          />
        </Flex>
        {/* 介绍 */}
        <Box mt={3}>
          <Box>介绍</Box>
          <Textarea {...register('intro')} bg={'myGray.50'} />
        </Box>
        {/* 模板类型 */}
        <HStack mt={3}>
          <Box flex={'0 0 140px'}>模板类型</Box>
          <Box flex={1}>
            <MySelect<FlowNodeTemplateTypeEnum>
              value={templateType}
              list={pluginTypeSelectList}
              onchange={(e) => {
                setValue('templateType', e);
              }}
            />
          </Box>
        </HStack>
        {isEdit && (
          <HStack mt={3}>
            <Box flex={1}>是否启用</Box>
            <Switch {...register('isActive')} />
          </HStack>
        )}
        <HStack mt={3}>
          <Box flex={'0 0 140px'}>权重(影响排序)</Box>
          <MyNumberInput
            flex={1}
            value={weight ?? 10}
            onChange={(e) => setValue('weight', e ?? 10)}
            step={1}
          />
        </HStack>
        <HStack mt={3}>
          <Box flex={'0 0 140px'}>价格(n 积分/次)</Box>
          <MyNumberInput
            flex={1}
            value={originCost ?? 0}
            onChange={(e) => setValue('originCost', e ?? 0)}
            step={0.01}
          />
        </HStack>
        {/* 输入配置 */}
        <HStack mt={5}>
          <Box flex={1}>变量字段:会替换编排配置中 {'{{key}}'}</Box>
          <Button
            variant={'whiteBase'}
            onClick={() => {
              appendInput({
                key: '',
                value: ''
              });
            }}
          >
            新增
          </Button>
        </HStack>
        {inputs.map((input, index) => (
          <HStack key={input.id} mt={2}>
            <Box flex={'0 0 140px'}>
              <Input
                {...register(`inputConfig.${index}.key`, { required: true })}
                placeholder="key"
              />
            </Box>
            <Box flex={1}>
              <Input
                {...register(`inputConfig.${index}.value`, { required: true })}
                placeholder={'value'}
              />
            </Box>
            <MyIcon
              name={'delete'}
              w={'1rem'}
              cursor={'pointer'}
              onClick={() => removeInput(index)}
            />
          </HStack>
        ))}

        {/* 配置文件 */}
        <Box mt={5}>
          <Box>工作流配置文件</Box>
          <Textarea
            rows={15}
            {...register('workflow', {
              required: true
            })}
            bg={'myGray.50'}
          />
        </Box>
      </ModalBody>
      <ModalFooter>
        {defaultForm.id && (
          <IconButton
            isLoading={isDeleting}
            icon={<MyIcon name="delete" w={'1rem'} />}
            variant={'whiteDanger'}
            aria-label={''}
            mr={3}
            onClick={() => {
              return openDeleteConfirm(() => onDelete({ id: defaultForm.id! }))();
            }}
          />
        )}
        <Button onClick={onClose} variant={'whiteBase'} mr={3}>
          取消
        </Button>
        <Button isLoading={loading} onClick={handleSubmit(onSubmit)}>
          {isEdit ? '更新' : '新建插件'}
        </Button>
      </ModalFooter>
      <File onSelect={onSelectFile} />
      <DeleteConfirmModal />
    </MyModal>
  );
};

export default CustomPluginConfig;
