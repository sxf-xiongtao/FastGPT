import { compressImgFileAndUpload } from '@/web/common/file/utils';
import {
  delPluginGroup,
  postCreatePluginGroup,
  putUpdatePluginGroup,
  putUpdatePluginGroupOrder
} from '@/web/core/app/plugin/api';
import { Box, Button, Flex, Input, ModalBody, ModalFooter } from '@chakra-ui/react';
import { getErrText } from '@fastgpt/global/common/error/utils';
import type { PluginGroupSchemaType, TGroupType } from '@fastgpt/service/core/app/plugin/type';
import { useSelectFile } from '@fastgpt/web/common/file/hooks/useSelectFile';
import Avatar from '@fastgpt/web/components/common/Avatar';
import MyModal from '@fastgpt/web/components/common/MyModal';
import MyTooltip from '@fastgpt/web/components/common/MyTooltip';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import { getNanoid } from '@fastgpt/global/common/string/tools';
import DndDrag, { Draggable } from '@fastgpt/web/components/common/DndDrag/index';
import { FlowNodeTemplateTypeEnum } from '@fastgpt/global/core/workflow/constants';
import { useTranslation } from 'next-i18next';

const defaultEmptyGroup = {
  groupId: '',
  groupAvatar: 'common/navbar/pluginLight',
  groupName: '',
  groupTypes: [],
  groupOrder: 0
};

const defaultEmptyType = {
  typeId: '',
  typeName: ''
};

const GroupConfigModal = ({
  onClose,
  onSuccess,
  allGroups
}: {
  onClose: () => void;
  onSuccess: () => void;
  allGroups: PluginGroupSchemaType[];
}) => {
  const newTypeInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const [editGroup, setEditGroup] = useState<PluginGroupSchemaType | undefined>(undefined);
  const [localGroups, setLocalGroups] = useState<PluginGroupSchemaType[]>([]);
  const [opendGroups, setOpendGroups] = useState<string[]>([]);
  const [newType, setNewType] = useState<TGroupType | undefined>(undefined);
  const [currentGroup, setCurrentGroup] = useState<PluginGroupSchemaType | undefined>(undefined);

  const { runAsync: deleteGroup } = useRequest2((groupId: string) => delPluginGroup({ groupId }), {
    manual: true,
    onSuccess: () => {
      onSuccess();
    }
  });

  const { ConfirmModal, openConfirm } = useConfirm({
    type: 'delete',
    content: '删除后，其下资源将同步删除且不可恢复。是否确认删除？'
  });

  useEffect(() => {
    if (newType !== undefined && newTypeInputRef.current) {
      newTypeInputRef.current?.focus();
    }
  }, [newType]);

  useEffect(() => {
    setLocalGroups(allGroups);
  }, [allGroups]);

  const { runAsync: addOrUpdateType } = useRequest2(
    (data: TGroupType) => {
      if (!currentGroup) return Promise.reject('No current group');
      if (data?.typeId) {
        const newGroup = {
          ...currentGroup,
          groupTypes: currentGroup.groupTypes.map((item) =>
            item.typeId === data.typeId ? data : item
          )
        };
        return putUpdatePluginGroup(newGroup);
      } else {
        data = {
          ...data,
          typeId: getNanoid(6)
        };
        const newGroup = { ...currentGroup, groupTypes: [...currentGroup.groupTypes, data] };
        return putUpdatePluginGroup(newGroup);
      }
    },
    {
      onSuccess: () => {
        onSuccess();
      }
    }
  );

  const { runAsync: deleteType } = useRequest2(
    (typeId: string) => {
      if (!currentGroup) return Promise.reject('No current group');
      const newGroup = {
        ...currentGroup,
        groupTypes: currentGroup.groupTypes.filter((item) => item.typeId !== typeId)
      };
      return putUpdatePluginGroup(newGroup);
    },
    {
      onSuccess: () => {
        onSuccess();
      }
    }
  );

  return (
    <MyModal
      isOpen
      title={'分组管理'}
      iconSrc={'common/setting'}
      iconColor={'primary.600'}
      onClose={onClose}
      w={'580px'}
      h={'600px'}
    >
      <ModalBody overflow={'auto'}>
        <Flex
          alignItems={'center'}
          color={'myGray.900'}
          pb={2}
          borderBottom={'1px solid'}
          borderColor={'myGray.200'}
          mx={4}
          pt={6}
          px={2}
        >
          <MyIcon name="menu" w={5} />
          <Box ml={2} fontWeight={'semibold'} flex={'1 0 0'}>
            共 {localGroups.length} 个分组
          </Box>
          <Button
            size={'sm'}
            leftIcon={<MyIcon name="common/addLight" w={4} />}
            variant={'outline'}
            fontSize={'xs'}
            onClick={() => {
              setEditGroup({ ...defaultEmptyGroup, groupOrder: localGroups.length });
            }}
          >
            添加
          </Button>
        </Flex>
        <DndDrag<PluginGroupSchemaType>
          onDragEndCb={async (list: PluginGroupSchemaType[]) => {
            const systemPluginIndex = list.findIndex((item) => item.groupId === 'systemPlugin');

            const newList = list.map((item, index) => {
              const order = index - systemPluginIndex;
              return {
                ...item,
                groupOrder: order
              };
            });
            setLocalGroups(newList);

            await putUpdatePluginGroupOrder({ groups: newList });
            onSuccess();
          }}
          dataList={localGroups}
        >
          {(provided) => (
            <Flex
              {...provided.droppableProps}
              ref={provided.innerRef}
              px={4}
              mt={1}
              flex={'1 0 0'}
              fontSize={'sm'}
              flexDirection={'column'}
            >
              {localGroups.map((item, index) => {
                const isSystem = item.groupId === 'systemPlugin';
                return (
                  <Draggable key={item.groupId} draggableId={item.groupId} index={index}>
                    {(provided, snapshot) => (
                      <Flex
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                          ...provided.draggableProps.style,
                          opacity: snapshot.isDragging ? 0.8 : 1
                        }}
                        key={item.groupId}
                        borderBottom={'1px solid'}
                        borderColor={'myGray.200'}
                        fontSize={'sm'}
                        fontWeight={'medium'}
                        color={'myGray.900'}
                        flexDirection={'column'}
                        gap={1}
                        py={1}
                      >
                        <Flex w={'full'}>
                          <Flex
                            h={8}
                            px={2}
                            py={1}
                            flex={'1'}
                            alignItems={'center'}
                            borderRadius={'xs'}
                          >
                            <Flex
                              h={'full'}
                              rounded={'xs'}
                              mr={2}
                              _hover={{ bg: 'myGray.05' }}
                              {...provided.dragHandleProps}
                            >
                              <MyIcon name="drag" w={'14px'} color={'myGray.400'} />
                            </Flex>
                            <Flex
                              h={'full'}
                              rounded={'xs'}
                              mr={2}
                              _hover={{ bg: 'myGray.05' }}
                              cursor={'pointer'}
                              onClick={() => {
                                setOpendGroups(
                                  opendGroups.includes(item.groupId)
                                    ? opendGroups.filter((id) => id !== item.groupId)
                                    : [...opendGroups, item.groupId]
                                );
                              }}
                            >
                              <MyIcon
                                name="common/solidChevronRight"
                                w={4}
                                color={'myGray.400'}
                                transform={
                                  opendGroups.includes(item.groupId) ? 'rotate(90deg)' : 'none'
                                }
                              />
                            </Flex>

                            <Avatar
                              src={item.groupAvatar}
                              w={'16px'}
                              rounded={'sm'}
                              mr={1.5}
                              color={'primary.600'}
                            />
                            <Box>{t(item.groupName as any)}</Box>
                            <Box ml={2} color={'myGray.500'}>{`(${item.groupTypes.length})`}</Box>
                            <Box flex={'1 0 0'} />
                            {!isSystem && (
                              <>
                                <Flex
                                  _hover={{ bg: 'myGray.05' }}
                                  mr={2}
                                  p={1}
                                  borderRadius={'sm'}
                                  onClick={() => {
                                    if (!opendGroups.includes(item.groupId)) {
                                      setOpendGroups([...opendGroups, item.groupId]);
                                    }
                                    setCurrentGroup(item);
                                    setNewType(defaultEmptyType);
                                  }}
                                  cursor={'pointer'}
                                >
                                  <MyIcon name="common/add2" w={4} color={'myGray.600'} />
                                </Flex>
                                <Flex
                                  _hover={{ bg: 'myGray.05' }}
                                  mr={2}
                                  p={1}
                                  borderRadius={'sm'}
                                  cursor={'pointer'}
                                  onClick={(e) => {
                                    setEditGroup(item);
                                  }}
                                >
                                  <MyIcon name="edit" w={4} color={'myGray.600'} />
                                </Flex>
                                <Flex
                                  _hover={{ bg: 'myGray.05' }}
                                  p={1}
                                  borderRadius={'sm'}
                                  cursor={'pointer'}
                                  onClick={() => {
                                    openConfirm(async () => {
                                      await deleteGroup(item.groupId);
                                    })();
                                  }}
                                >
                                  <MyIcon name="delete" w={4} color={'myGray.600'} />
                                </Flex>
                              </>
                            )}
                          </Flex>
                        </Flex>
                        {!!newType && !newType.typeId && currentGroup?.groupId === item.groupId && (
                          <Flex pl={'54px'} pr={2} h={6} alignItems={'center'}>
                            <Input
                              placeholder={'添加类型'}
                              value={newType?.typeName}
                              h={8}
                              ref={newTypeInputRef}
                              onChange={(e) => {
                                setNewType({
                                  ...newType,
                                  typeName: e.target.value
                                });
                              }}
                              onBlur={() => {
                                if (newType?.typeName) {
                                  addOrUpdateType(newType);
                                }
                                setNewType(undefined);
                              }}
                            />
                          </Flex>
                        )}

                        {opendGroups.includes(item.groupId) && (
                          <DndDrag<TGroupType>
                            onDragEndCb={async (list: TGroupType[]) => {
                              const newGroup = {
                                ...item,
                                groupTypes: list
                              };

                              setLocalGroups(
                                localGroups.map((group) =>
                                  group.groupId === item.groupId ? newGroup : group
                                )
                              );

                              await putUpdatePluginGroup(newGroup);
                              onSuccess();
                            }}
                            dataList={item.groupTypes}
                          >
                            {(provided) => (
                              <Box {...provided.droppableProps} ref={provided.innerRef}>
                                {opendGroups.includes(item.groupId) &&
                                  item.groupTypes.map((type, index) => {
                                    const isSystemType = Object.values(
                                      FlowNodeTemplateTypeEnum
                                    ).includes(type.typeId as FlowNodeTemplateTypeEnum);
                                    return (
                                      <Draggable
                                        key={type.typeId}
                                        draggableId={type.typeId}
                                        index={index}
                                      >
                                        {(provided, snapshot) => (
                                          <Box
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            style={{
                                              ...provided.draggableProps.style,
                                              opacity: snapshot.isDragging ? 0.8 : 1
                                            }}
                                          >
                                            <Flex
                                              key={type.typeId}
                                              pl={'54px'}
                                              pr={2}
                                              h={6}
                                              py={1}
                                              my={1}
                                              alignItems={'center'}
                                              fontWeight={'400'}
                                            >
                                              {newType?.typeId === type.typeId ? (
                                                <>
                                                  <Input
                                                    placeholder={'添加类型'}
                                                    value={newType?.typeName}
                                                    h={8}
                                                    ref={newTypeInputRef}
                                                    onChange={(e) => {
                                                      setNewType({
                                                        ...newType,
                                                        typeName: e.target.value
                                                      });
                                                    }}
                                                    onBlur={() => {
                                                      if (newType?.typeName) {
                                                        addOrUpdateType(newType);
                                                      }
                                                      setNewType(undefined);
                                                    }}
                                                  />
                                                </>
                                              ) : (
                                                <>
                                                  <Flex
                                                    h={'full'}
                                                    rounded={'xs'}
                                                    mr={2}
                                                    _hover={{ bg: 'myGray.05' }}
                                                    {...provided.dragHandleProps}
                                                  >
                                                    <MyIcon
                                                      name="drag"
                                                      w={'14px'}
                                                      color={'myGray.400'}
                                                    />
                                                  </Flex>
                                                  {t(type.typeName as any)}
                                                  <Box flex={'1 0 0'} />
                                                  {!isSystemType && (
                                                    <>
                                                      <Flex
                                                        _hover={{ bg: 'myGray.05' }}
                                                        mr={2}
                                                        p={1}
                                                        borderRadius={'sm'}
                                                        cursor={'pointer'}
                                                        onClick={(e) => {
                                                          setCurrentGroup(item);
                                                          setNewType(type);
                                                        }}
                                                      >
                                                        <MyIcon
                                                          name="edit"
                                                          w={4}
                                                          color={'myGray.600'}
                                                        />
                                                      </Flex>
                                                      <Flex
                                                        _hover={{ bg: 'myGray.05' }}
                                                        p={1}
                                                        borderRadius={'sm'}
                                                        cursor={'pointer'}
                                                        onClick={() => {
                                                          setCurrentGroup(item);
                                                          openConfirm(async () => {
                                                            await deleteType(type.typeId);
                                                          })();
                                                        }}
                                                      >
                                                        <MyIcon
                                                          name="delete"
                                                          w={4}
                                                          color={'myGray.600'}
                                                        />
                                                      </Flex>
                                                    </>
                                                  )}
                                                </>
                                              )}
                                            </Flex>
                                          </Box>
                                        )}
                                      </Draggable>
                                    );
                                  })}
                              </Box>
                            )}
                          </DndDrag>
                        )}
                      </Flex>
                    )}
                  </Draggable>
                );
              })}
            </Flex>
          )}
        </DndDrag>
      </ModalBody>
      <ModalFooter>
        <Button onClick={onClose}>确定</Button>
      </ModalFooter>
      {!!editGroup && (
        <GroupItemModal
          group={editGroup}
          onClose={() => setEditGroup(undefined)}
          onSuccess={onSuccess}
        />
      )}
      <ConfirmModal />
    </MyModal>
  );
};

const GroupItemModal = ({
  group,
  onClose,
  onSuccess
}: {
  group: PluginGroupSchemaType;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const isEdit = !!group?.groupId;

  const { toast } = useToast();

  const { register, setValue, watch, handleSubmit } = useForm({
    defaultValues: group
  });
  const groupAvatar = watch('groupAvatar');

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
        setValue('groupAvatar', src);
      } catch (err: any) {
        toast({
          title: getErrText(err, '头像选择异常'),
          status: 'warning'
        });
      }
    },
    [setValue, toast]
  );

  const { runAsync: onSubmit, loading } = useRequest2(
    (data: PluginGroupSchemaType) => {
      if (isEdit) {
        return putUpdatePluginGroup(data);
      }
      return postCreatePluginGroup(data);
    },
    {
      onSuccess: () => {
        onClose();
        onSuccess();
      }
    }
  );

  return (
    <MyModal
      isOpen
      title={isEdit ? `重命名` : `添加分组`}
      iconSrc={isEdit ? 'edit' : 'common/addLight'}
      iconColor={'primary.600'}
      onClose={onClose}
    >
      <ModalBody>
        <Box color={'myGray.800'} fontWeight={'bold'}>
          头像 & 名称
        </Box>
        <Flex mt={2} alignItems={'center'}>
          <MyTooltip label={'点击设置头像'}>
            <Flex alignItems={'center'}>
              <Avatar
                flexShrink={0}
                src={groupAvatar}
                w={['28px', '36px']}
                h={['28px', '36px']}
                cursor={'pointer'}
                borderRadius={'md'}
                color={'primary.600'}
                onClick={onOpenSelectFile}
              />
            </Flex>
          </MyTooltip>
          <Input
            flex={1}
            ml={3}
            autoFocus
            bg={'myWhite.600'}
            {...register('groupName', {
              required: '分组名称不能为空'
            })}
          />
        </Flex>
      </ModalBody>
      <ModalFooter>
        <Button variant={'outline'} onClick={onClose} mr={4}>
          取消
        </Button>
        <Button isLoading={loading} onClick={handleSubmit(onSubmit)}>
          确认
        </Button>
      </ModalFooter>
      <File onSelect={onSelectFile} />
    </MyModal>
  );
};

export default GroupConfigModal;
