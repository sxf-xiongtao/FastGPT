import React, { useCallback, useMemo, useState } from 'react';
import type { EditCustomPluginType } from '@/global/core/workflow/plugin/type.d';
import { useForm } from 'react-hook-form';
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
  Textarea,
  useDisclosure
} from '@chakra-ui/react';
import MyModal from '@fastgpt/web/components/common/MyModal';
import Avatar from '@fastgpt/web/components/common/Avatar';
import { useSelectFile } from '@fastgpt/web/common/file/hooks/useSelectFile';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { compressImgFileAndUpload } from '@/web/common/file/utils';
import { getErrText } from '@fastgpt/global/common/error/utils';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import MySelect from '@fastgpt/web/components/common/MySelect';
import MyIcon from '@fastgpt/web/components/common/Icon';
import {
  delPlugin,
  getAllUserPlugins,
  postCreatePlugin,
  putUpdatePlugin
} from '@/web/core/app/plugin/api';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import MyNumberInput from '@fastgpt/web/components/common/Input/NumberInput';
import type { PluginGroupSchemaType } from '@fastgpt/service/core/app/plugin/type';
import { useTranslation } from 'next-i18next';

export const defaultCustomPluginForm: EditCustomPluginType = {
  templateType: '',
  name: '',
  avatar: 'core/app/type/pluginFill',
  intro: '',
  isActive: true,
  hasTokenFee: false,
  originCost: 0,
  currentCost: 0,
  inputConfig: [],
  workflow: '',
  userGuide: ''
};

const CustomPluginConfig = ({
  group,
  defaultForm = defaultCustomPluginForm,
  onSuccess,
  onClose
}: {
  group: PluginGroupSchemaType;
  defaultForm: EditCustomPluginType;
  onSuccess: () => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const isEdit = !!defaultForm.id;
  const { toast } = useToast();

  const [searchKey, setSearchKey] = useState('');
  const [lastPluginId, setLastPluginId] = useState<string | undefined>('');

  const { data: plugins = [] } = useRequest2(() => getAllUserPlugins({ searchKey }), {
    manual: false,
    refreshDeps: [searchKey]
  });

  const { register, setValue, watch, handleSubmit } = useForm({
    defaultValues: defaultForm
  });
  const name = watch('name');
  const avatar = watch('avatar');
  const templateType = watch('templateType');
  const associatedPluginId = watch('associatedPluginId');
  const currentCost = watch('currentCost');

  const currentPlugin = useMemo(() => {
    return plugins.find((item) => item._id === associatedPluginId);
  }, [plugins, associatedPluginId]);

  const pluginTypeSelectList = useMemo(
    () =>
      group?.groupTypes.map((type) => ({
        label: t(type.typeName as any),
        value: type.typeId
      })),
    [group?.groupTypes, t]
  );

  const {
    isOpen: isOpenPluginListMenu,
    onClose: onClosePluginListMenu,
    onOpen: onOpenPluginListMenu
  } = useDisclosure();

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
          title: getErrText(err, '上传头像失败'),
          status: 'warning'
        });
      }
    },
    [setValue, toast]
  );

  const { runAsync: onSubmit, loading } = useRequest2(
    (data: EditCustomPluginType) => {
      if (!data.associatedPluginId) {
        return Promise.reject('关联插件不能为空');
      }

      const formatData = {
        pluginId: defaultForm.id ? defaultForm.id : '',
        name: data.name,
        avatar: data.avatar,
        intro: data.intro,
        inputConfig: data.inputConfig.map((item) => ({
          key: item.key,
          label: item.key,
          description: item.key,
          value: item.value
        })),
        templateType: data.templateType || pluginTypeSelectList?.[0].value,
        isActive: data.isActive,
        hasTokenFee: data.hasTokenFee,
        originCost: data.originCost,
        currentCost: data.currentCost,
        associatedPluginId: data.associatedPluginId,
        userGuide: data.userGuide
      };

      if (formatData.pluginId) {
        return putUpdatePlugin(formatData);
      }

      return postCreatePlugin(formatData);
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
  const { runAsync: onDelete, loading: isDeleting } = useRequest2(delPlugin, {
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
      maxW={['90vw', '900px']}
      w={'100%'}
      iconSrc={avatar}
      position={'relative'}
    >
      <ModalBody flex={1} overflow={'auto'} w={'full'}>
        <Flex w={'full'} gap={5}>
          <Box w={'full'}>
            {/* 头像 */}
            <Box color={'myGray.800'} fontWeight={'bold'}>
              取个名字
            </Box>
            <Flex mt={2} alignItems={'center'}>
              <MyTooltip label={'点击上传头像'}>
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
              />
            </Box>
            <HStack mt={3}>
              <Box flex={'0 0 140px'} fontSize={'sm'} fontWeight={'medium'}>
                关联插件
              </Box>
              <Flex flex={'1 0 0'} flexDirection={'column'}>
                {associatedPluginId && (
                  <Avatar
                    src={currentPlugin?.avatar}
                    mt={2}
                    ml={2}
                    w={'20px'}
                    borderRadius={'2px'}
                    position="absolute"
                  />
                )}
                <Input
                  pl={associatedPluginId ? 8 : 4}
                  fontSize={'14px'}
                  placeholder="输入插件名查找插件"
                  value={currentPlugin?.name}
                  onChange={(e) => {
                    setSearchKey(e.target.value);
                  }}
                  onFocus={() => {
                    onOpenPluginListMenu();
                    setLastPluginId(associatedPluginId);
                    setValue('associatedPluginId', undefined as any);
                  }}
                  onBlur={() => {
                    onClosePluginListMenu();
                    if (associatedPluginId) return;
                    setValue('associatedPluginId', lastPluginId);
                  }}
                />
                {isOpenPluginListMenu && plugins.length > 0 && (
                  <Flex
                    position={'absolute'}
                    mt={9}
                    w={'100%'}
                    flexDirection={'column'}
                    gap={2}
                    p={1}
                    boxShadow="lg"
                    bg="white"
                    borderRadius="md"
                    zIndex={10}
                    maxH={'200px'}
                    maxW={'260px'}
                    overflow={'auto'}
                  >
                    {plugins.map((item) => (
                      <Flex
                        key={item._id}
                        p="2"
                        alignItems={'center'}
                        _hover={{ bg: 'myGray.100' }}
                        mx="1"
                        borderRadius="sm"
                        cursor={'pointer'}
                        onMouseDown={() => {
                          setSearchKey(item.name);
                          setValue('associatedPluginId', item._id);
                          onClosePluginListMenu();
                        }}
                      >
                        <Avatar src={item.avatar} w="1.25rem" rounded={'2px'} />
                        <Box ml="2" fontSize={'14px'}>
                          {item.name}
                        </Box>
                      </Flex>
                    ))}
                  </Flex>
                )}
              </Flex>
            </HStack>
            {/* 模板类型 */}
            <HStack mt={3}>
              <Box flex={'0 0 140px'} fontSize={'sm'} fontWeight={'medium'}>
                属性
              </Box>
              <Box flex={1}>
                <MySelect
                  value={templateType || pluginTypeSelectList?.[0].value}
                  list={pluginTypeSelectList}
                  onchange={(e) => {
                    setValue('templateType', e as any);
                  }}
                />
              </Box>
            </HStack>
            <HStack mt={3}>
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
              />
            </HStack>
          </Box>
          <Box w={'full'}>
            <Box mb={'9px'} fontSize={'sm'} fontWeight={'medium'}>
              使用说明
            </Box>
            <Textarea
              {...register('userGuide')}
              placeholder={'使用 markdown 语法'}
              bg={'myGray.50'}
              minH={'392px'}
            />
          </Box>
        </Flex>
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
