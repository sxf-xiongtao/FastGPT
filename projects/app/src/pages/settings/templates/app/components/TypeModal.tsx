import { Box, Button, Flex, Input, ModalBody, ModalFooter } from '@chakra-ui/react';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import DndDrag, { Draggable } from '@fastgpt/web/components/common/DndDrag/index';
import { useTranslation } from 'next-i18next';
import { defaultTemplateTypes } from '@fastgpt/web/core/workflow/constants';
import {
  delTemplateType,
  postSaveTemplateType,
  putUpdateTemplateTypeOrder
} from '@/web/core/app/templates/api';
import { TemplateTypeSchemaType } from '@fastgpt/global/core/app/type';
import { nanoid } from 'nanoid';
import dynamic from 'next/dynamic';

const defaultEmptyType = {
  typeId: '',
  typeName: '',
  typeOrder: 0
};

const TemplateTypeModal = ({
  onClose,
  onSuccess,
  typeList = []
}: {
  onClose: () => void;
  onSuccess: () => void;
  typeList: TemplateTypeSchemaType[];
}) => {
  const { t } = useTranslation();

  const [editType, setEditType] = useState<TemplateTypeSchemaType>();
  const [localTypes, setLocalTypes] = useState<TemplateTypeSchemaType[]>(typeList);

  const { runAsync: deleteType } = useRequest2((typeId: string) => delTemplateType({ typeId }), {
    manual: true,
    onSuccess
  });
  const { ConfirmModal, openConfirm } = useConfirm({
    type: 'delete',
    content: '删除后，其下资源将同步删除且不可恢复。是否确认删除？'
  });

  useEffect(() => {
    setLocalTypes(typeList);
  }, [typeList]);

  return (
    <MyModal
      isOpen
      title={'分类管理'}
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
            共 {localTypes.length} 个分类
          </Box>
          <Button
            size={'sm'}
            leftIcon={<MyIcon name="common/addLight" w={4} />}
            variant={'outline'}
            fontSize={'xs'}
            onClick={() => {
              setEditType({ ...defaultEmptyType, typeOrder: localTypes.length });
            }}
          >
            添加
          </Button>
        </Flex>
        <DndDrag<TemplateTypeSchemaType>
          onDragEndCb={async (list: TemplateTypeSchemaType[]) => {
            const newList = list.map((item, index) => {
              return {
                ...item,
                typeOrder: index
              };
            });

            setLocalTypes(newList);
            await putUpdateTemplateTypeOrder({ types: newList });
            onSuccess();
          }}
          dataList={localTypes}
        >
          {({ provided }) => (
            <Flex
              {...provided.droppableProps}
              ref={provided.innerRef}
              px={4}
              mt={1}
              flex={'1 0 0'}
              fontSize={'sm'}
              flexDirection={'column'}
            >
              {localTypes.map((item, index) => {
                const isSystem = defaultTemplateTypes.find((t) => t.typeId === item.typeId);
                return (
                  <Draggable key={item.typeId} draggableId={item.typeId} index={index}>
                    {(provided, snapshot) => (
                      <Flex
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                          ...provided.draggableProps.style,
                          opacity: snapshot.isDragging ? 0.8 : 1
                        }}
                        key={item.typeId}
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

                            <Box>{t(item.typeName as any)}</Box>
                            <Box flex={'1 0 0'} />

                            {!isSystem && (
                              <>
                                <Flex
                                  _hover={{ bg: 'myGray.05' }}
                                  p={1}
                                  borderRadius={'sm'}
                                  cursor={'pointer'}
                                  onClick={(e) => {
                                    setEditType(item);
                                  }}
                                >
                                  <MyIcon name="edit" w={4} color={'myGray.600'} />
                                </Flex>
                                <Flex
                                  _hover={{ bg: 'myGray.05' }}
                                  ml={1}
                                  p={1}
                                  borderRadius={'sm'}
                                  cursor={'pointer'}
                                  onClick={() => {
                                    openConfirm(async () => {
                                      await deleteType(item.typeId);
                                    })();
                                  }}
                                >
                                  <MyIcon name="delete" w={4} color={'myGray.600'} />
                                </Flex>
                              </>
                            )}
                          </Flex>
                        </Flex>
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
      {!!editType && (
        <TemplateTypeItemModal
          type={editType}
          onClose={() => setEditType(undefined)}
          onSuccess={onSuccess}
        />
      )}
      <ConfirmModal />
    </MyModal>
  );
};

const TemplateTypeItemModal = ({
  type,
  onClose,
  onSuccess
}: {
  type: TemplateTypeSchemaType;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const isEdit = !!type?.typeId;

  const { register, handleSubmit } = useForm({
    defaultValues: type
  });

  const { runAsync: onSubmit, loading } = useRequest2(
    (data: TemplateTypeSchemaType) =>
      postSaveTemplateType({
        ...data,
        typeId: isEdit ? type.typeId : nanoid()
      }),
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
      title={isEdit ? `重命名` : `添加分类`}
      iconSrc={isEdit ? 'edit' : 'common/addLight'}
      iconColor={'primary.600'}
      onClose={onClose}
    >
      <ModalBody>
        <Box color={'myGray.800'} fontWeight={'bold'}>
          分类名
        </Box>
        <Flex mt={2} alignItems={'center'}>
          <Input
            flex={1}
            autoFocus
            bg={'myWhite.600'}
            {...register('typeName', {
              required: '分类名不能为空'
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
    </MyModal>
  );
};

export default dynamic(() => Promise.resolve(TemplateTypeModal), {
  ssr: false
});
