import { compressImgFileAndUpload } from '@/web/common/file/utils';
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  ModalFooter,
  Switch,
  Textarea
} from '@chakra-ui/react';
import { ModalBody } from '@chakra-ui/react';
import { getErrText } from '@fastgpt/global/common/error/utils';
import { AppTemplateTypeEnum, AppTypeEnum } from '@fastgpt/global/core/app/constants';
import { useSelectFile } from '@fastgpt/web/common/file/hooks/useSelectFile';
import Avatar from '@fastgpt/web/components/common/Avatar';
import MyModal from '@fastgpt/web/components/common/MyModal';
import MySelect from '@fastgpt/web/components/common/MySelect';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useToast } from '@fastgpt/web/hooks/useToast';
import React, { DragEvent, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { delTemplate, postCreateTemplate, putUpdateTemplate } from '@/web/core/app/templates/api';
import { PluginSourceEnum } from '@fastgpt/global/core/plugin/constants';
import { useTranslation } from 'next-i18next';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import FillRowTabs from '@fastgpt/web/components/common/Tabs/FillRowTabs';
import { AppTemplateSchemaType, TemplateTypeSchemaType } from '@fastgpt/global/core/app/type';
import dynamic from 'next/dynamic';
import { getAppType } from '@fastgpt/global/core/app/utils';

export const defaultTemplate: AppTemplateSchemaType = {
  templateId: '',
  name: '',
  intro: '',
  avatar: '',
  author: '',
  tags: [AppTemplateTypeEnum.writing],
  type: 'advanced',
  isActive: true,
  userGuide: {
    type: 'markdown',
    content: '',
    link: ''
  },
  workflow: {
    nodes: [],
    edges: []
  }
};

const map = {
  [AppTypeEnum.simple]: '简易应用',
  [AppTypeEnum.workflow]: '工作流',
  [AppTypeEnum.plugin]: '插件',
  [AppTypeEnum.folder]: '文件夹',
  [AppTypeEnum.httpPlugin]: 'HTTP 插件',
  [AppTypeEnum.toolSet]: '工具集',
  [AppTypeEnum.tool]: '工具'
};

const TemplateConfigModal = ({
  defaultForm = defaultTemplate,
  templateTypes = [],
  onSuccess,
  onClose
}: {
  defaultForm: AppTemplateSchemaType;
  templateTypes: TemplateTypeSchemaType[];
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isPc } = useSystem();
  const [isDragging, setIsDragging] = useState(false);
  const [workflowStr, setWorkflowStr] = useState('');

  const { register, setValue, watch, handleSubmit } = useForm({
    defaultValues: defaultForm
  });

  const avatar = watch('avatar');
  const workflow = watch('workflow');
  const templateId = watch('templateId');
  const userGuideType = watch('userGuide.type') ?? 'markdown';
  const type = watch('type');
  const tags = watch('tags');

  const source = templateId.split('-')[0];
  const isCommunity = source === PluginSourceEnum.community;

  const isEdit = !!defaultForm.templateId;

  const { File: AvatarFile, onOpen: onOpenSelectAvatarFile } = useSelectFile({
    fileType: '.jpg,.png',
    multiple: false
  });

  const onSelectAvatarFile = useCallback(
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
          title: getErrText(err, '上传头像失败'),
          status: 'warning'
        });
      }
    },
    [setValue, toast]
  );

  const { File: ConfigFile, onOpen: onOpenSelectConfigFile } = useSelectFile({
    fileType: 'json',
    multiple: false
  });

  const readJSONFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!file.name.endsWith('.json')) {
          toast({
            title: '请选择 JSON 文件',
            status: 'error'
          });
          return;
        }
        if (e.target) {
          setWorkflowStr(e.target.result as string);
        }
      };
      reader.readAsText(file);
    },
    [toast]
  );

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      readJSONFile(file);
      setIsDragging(false);
    },
    [readJSONFile]
  );

  const onSelectConfigFile = useCallback(
    async (e: File[]) => {
      const file = e[0];
      readJSONFile(file);
    },
    [readJSONFile]
  );

  const { ConfirmModal: DeleteConfirmModal, openConfirm: openDeleteConfirm } = useConfirm({
    type: 'delete',
    content: '确认删除该模板么？'
  });

  const { runAsync: onDelete, loading: isDeleting } = useRequest2(delTemplate, {
    onSuccess() {
      toast({
        title: '删除成功',
        status: 'success'
      });
      onSuccess();
      onClose();
    }
  });

  const { runAsync: onSubmit, loading } = useRequest2(
    async (data: AppTemplateSchemaType) => {
      if (!workflowStr) {
        return Promise.reject('请先上传配置文件');
      }

      if (!data.type) {
        return Promise.reject('未识别到应用类型');
      }

      let workflow;
      try {
        workflow = JSON.parse(workflowStr);
      } catch (error) {
        return Promise.reject('配置文件 JSON 格式错误');
      }

      const body = {
        templateId: data.templateId,
        name: data.name,
        intro: data.intro,
        avatar: data.avatar,
        author: data.author,
        tags: data.tags,
        type: data.type,
        isActive: data.isActive,
        userGuide: {
          type: data.userGuide?.type ?? 'markdown',
          content: data.userGuide?.content ?? '',
          link: data.userGuide?.link ?? ''
        },
        workflow
      };

      if (isEdit) {
        await putUpdateTemplate(body);
      } else {
        await postCreateTemplate(body);
      }
    },
    {
      successToast: isEdit ? '模板更新成功' : '模板创建成功',
      onSuccess: () => {
        onSuccess();
        onClose();
      }
    }
  );

  useEffect(() => {
    try {
      setWorkflowStr(JSON.stringify(workflow, null, 2));
    } catch (err) {
      console.error('JSON 序列化失败:', err);
      setWorkflowStr('');
    }
  }, [workflow]);

  useEffect(() => {
    try {
      const workflow = JSON.parse(workflowStr);
      setValue('type', getAppType(workflow));
    } catch (err) {
      console.error('获取应用类型失败:', err);
    }
  }, [setValue, workflowStr]);

  return (
    <MyModal
      isOpen
      isCentered
      title="模板配置"
      iconSrc={'common/templateMarket'}
      iconColor={'primary.600'}
      maxW={['90vw', '900px']}
      w={'100%'}
      position={'relative'}
    >
      <ModalBody>
        <Flex w={'full'} gap={5}>
          <Box w={'full'}>
            <Box color={'myGray.800'} fontWeight={'bold'}>
              取个名字
            </Box>
            <Flex mt={2} alignItems={'center'}>
              <MyTooltip label={isCommunity ? '' : '点击上传头像'}>
                {!avatar ? (
                  <Box
                    w={['28px', '36px']}
                    h={['28px', '36px']}
                    cursor={'pointer'}
                    borderRadius={'md'}
                    border={'1px dashed'}
                    borderColor={'myGray.300'}
                    color={'myGray.500'}
                    display={'flex'}
                    alignItems={'center'}
                    justifyContent={'center'}
                    _hover={{ color: 'primary.600', borderColor: 'primary.300' }}
                    onClick={onOpenSelectAvatarFile}
                  >
                    <MyIcon name="export" w={'16px'} h={'16px'} />
                  </Box>
                ) : (
                  <Avatar
                    flexShrink={0}
                    src={avatar}
                    w={['28px', '36px']}
                    h={['28px', '36px']}
                    borderRadius={'md'}
                    {...(!isCommunity && {
                      cursor: 'pointer',
                      onClick: onOpenSelectAvatarFile
                    })}
                  />
                )}
              </MyTooltip>
              <Input
                flex={1}
                ml={3}
                autoFocus
                bg={'myWhite.600'}
                disabled={isCommunity}
                {...register('name', {
                  required: '应用名不能为空'
                })}
              />
            </Flex>
            {/* 介绍 */}
            <Box mt={3}>
              <Box fontSize={'sm'} fontWeight={'medium'}>
                介绍
              </Box>
              <Textarea
                {...register('intro')}
                bg={'myGray.50'}
                placeholder={'为这个应用添加一个介绍'}
                disabled={isCommunity}
              />
            </Box>
            {/* 模板类型 */}
            <HStack mt={3}>
              <Box flex={'0 0 140px'} fontSize={'sm'} fontWeight={'medium'}>
                属性
              </Box>
              <Box flex={1}>
                <MySelect
                  value={tags.filter((t) => t !== 'recommendation')[0]}
                  list={templateTypes.map((templateType) => ({
                    label: t(templateType.typeName as any),
                    value: templateType.typeId
                  }))}
                  onChange={(e) => {
                    setValue('tags', [e as any]);
                  }}
                  isDisabled={isCommunity}
                />
              </Box>
            </HStack>
            <HStack mt={3}>
              <Box flex={'0 0 140px'} fontSize={'sm'} fontWeight={'medium'}>
                作者名称
              </Box>
              <Box flex={1}>
                <Input
                  flex={1}
                  disabled={isCommunity}
                  {...register('author')}
                  placeholder="默认为系统名"
                />
              </Box>
            </HStack>
            <HStack mt={3}>
              <Box flex={1} fontSize={'sm'} fontWeight={'medium'}>
                是否启用
              </Box>
              <Switch {...register('isActive')} />
            </HStack>
            <HStack mt={3}>
              {isDragging ? (
                <Flex
                  align={'center'}
                  justify={'center'}
                  w={'full'}
                  h={'136px'}
                  borderRadius={'md'}
                  border={'1px dashed'}
                  borderColor={'myGray.400'}
                  onDragEnter={handleDragEnter}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onDragLeave={handleDragLeave}
                >
                  <Flex align={'center'} justify={'center'} flexDir={'column'} gap={'0.62rem'}>
                    <MyIcon name={'configmap'} w={'1.5rem'} color={'myGray.500'} />
                    <Box color={'myGray.600'} fontSize={'mini'}>
                      文件将覆盖当前内容
                    </Box>
                  </Flex>
                </Flex>
              ) : (
                <Box w={'full'}>
                  <Flex justify={'space-between'} align={'center'} mb={isCommunity ? 0 : 2}>
                    <Box fontSize={'sm'} fontWeight={'500'}>
                      配置文件
                    </Box>
                    {isCommunity ? (
                      <Box fontSize={'sm'}>官方配置</Box>
                    ) : (
                      <Button onClick={onOpenSelectConfigFile} variant={'whiteBase'} p={0}>
                        <Flex px={'0.88rem'} py={'0.44rem'} color={'myGray.600'} fontSize={'mini'}>
                          <MyIcon name={'file/uploadFile'} w={'1rem'} mr={'0.38rem'} />
                          上传文件
                        </Flex>
                      </Button>
                    )}
                  </Flex>
                  {!isCommunity && (
                    <Box
                      onDragEnter={handleDragEnter}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onDragLeave={handleDragLeave}
                    >
                      <Textarea
                        bg={'myGray.50'}
                        border={'1px solid'}
                        borderRadius={'md'}
                        borderColor={'myGray.200'}
                        value={workflowStr}
                        placeholder={isPc ? '粘贴配置或拖入 JSON 文件' : '粘贴配置'}
                        rows={4}
                        onChange={(e) => {
                          setWorkflowStr(e.target.value);
                        }}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </HStack>
            <HStack mt={3}>
              <Flex flex={1} fontSize={'sm'} fontWeight={'medium'}>
                <Box>应用类型</Box>
                <Box color={'myGray.500'}>{'(自动识别)'}</Box>
              </Flex>
              <Flex fontSize={'sm'}>{type ? map[type as AppTypeEnum] : '未识别到应用属性'}</Flex>
            </HStack>
          </Box>
          <Box w={'full'}>
            <Flex mb={'9px'} alignItems={'center'}>
              <Box fontSize={'sm'} fontWeight={'medium'} flex={1}>
                使用说明
              </Box>
              <FillRowTabs
                list={[
                  { label: '文本', value: 'markdown' },
                  { label: '链接', value: 'link' }
                ]}
                value={userGuideType}
                onChange={(e) => setValue('userGuide.type', e as 'markdown' | 'link')}
              />
            </Flex>
            {userGuideType === 'markdown' ? (
              <Textarea
                {...register('userGuide.content')}
                placeholder={'使用 markdown 语法'}
                bg={'myGray.50'}
                minH={'432px'}
              />
            ) : (
              <Input {...register('userGuide.link')} placeholder={'请输入链接'} bg={'myGray.50'} />
            )}
          </Box>
        </Flex>
      </ModalBody>
      <ModalFooter>
        {isEdit && !isCommunity && (
          <IconButton
            isLoading={isDeleting}
            icon={<MyIcon name="delete" w={'1rem'} />}
            variant={'whiteDanger'}
            aria-label={''}
            mr={3}
            onClick={() => {
              return openDeleteConfirm(() => onDelete({ id: defaultForm.templateId }))();
            }}
          />
        )}
        <Button onClick={onClose} variant={'whiteBase'} mr={3}>
          取消
        </Button>
        <Button isLoading={loading} onClick={handleSubmit(onSubmit)}>
          确认
        </Button>
      </ModalFooter>
      <ConfigFile onSelect={onSelectConfigFile} />
      <AvatarFile onSelect={onSelectAvatarFile} />
      <DeleteConfirmModal />
    </MyModal>
  );
};

export default dynamic(() => Promise.resolve(TemplateConfigModal), {
  ssr: false
});
