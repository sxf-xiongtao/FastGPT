import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { POST } from '@/service/common/request';
import { useQueryClient } from '@tanstack/react-query';
import { AddIcon, EditIcon } from '@chakra-ui/icons';

export default function EditModal(props: { data: any; isCreate?: boolean }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data, isCreate } = props;
  const queryClient = useQueryClient();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: data
  });

  const onSubmit = async (formData: any) => {
    if (!isCreate) {
      POST(`/admin/routes/users/updateUser`, formData)
        .then((res) => {
          toast({
            title: '更新成功',
            status: 'success',
            duration: 2000,
            isClosable: false,
            position: 'top'
          });
          queryClient.invalidateQueries(['getUsers']);
          onClose();
        })
        .catch((err) => {
          toast({
            title: err.message,
            status: 'error',
            duration: 2000,
            isClosable: false,
            position: 'top'
          });
        });
    } else {
      POST(`/admin/routes/users/addUser`, formData)
        .then((res) => {
          toast({
            title: '添加成功',
            status: 'success',
            duration: 2000,
            isClosable: false,
            position: 'top'
          });
          queryClient.invalidateQueries(['getUsers']);
          onClose();
        })
        .catch((err) => {
          toast({
            title: err.message,
            status: 'error',
            duration: 2000,
            isClosable: false,
            position: 'top'
          });
        });
    }
  };

  return (
    <>
      {isCreate ? (
        <Button
          className="ml-8 w-20 !h-8 mt-[2px]"
          variant="outline"
          leftIcon={<AddIcon boxSize={2} />}
          onClick={() => {
            onOpen();
            reset(data);
          }}
        >
          添加用户
        </Button>
      ) : (
        <span
          className="p-1 flex items-center justify-center rounded hover:bg-slate-100 cursor-pointer"
          onClick={() => {
            onOpen();
            reset(data);
          }}
        >
          <EditIcon className="text-[14px]" />
        </span>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent m={'auto'}>
          <ModalHeader>{isCreate ? '添加' : '更改'}</ModalHeader>
          <ModalBody>
            <FormControl>
              <FormLabel htmlFor="username" className="!mb-0 !font-bold text-grayModern-700">
                用户名
                {errors && !!errors?.username && (
                  <span className="ml-2 text-[12px] text-red-500">*必填</span>
                )}
              </FormLabel>
              <Input
                {...register('username', {
                  required: 'This is required'
                })}
                className="!text-xl"
                id="username"
                variant="outline"
                placeholder="用户名"
              />
            </FormControl>
            <FormControl className="mt-4">
              <FormLabel htmlFor="password" className="!mb-0 !font-bold text-grayModern-700">
                密码
                {errors && !!errors?.password && isCreate && (
                  <span className="ml-2 text-[12px] text-red-500">*必填</span>
                )}
              </FormLabel>
              <Input
                {...register('password', {
                  required: isCreate ? 'This is required' : false
                })}
                className="!text-xl"
                id="password"
                variant="outline"
                placeholder={isCreate ? '密码' : '∗∗∗∗∗∗∗∗'}
              />
            </FormControl>
            <FormControl className="mt-4">
              <FormLabel htmlFor="balance" className="!mb-0 !font-bold text-grayModern-700">
                余额
                {errors && !!errors?.balance && (
                  <span className="ml-2 text-[12px] text-red-500">*必填</span>
                )}
              </FormLabel>
              <Input
                {...register('balance', {
                  required: 'This is required'
                })}
                className="!text-xl"
                id="balance"
                variant="outline"
                placeholder="余额"
              />
            </FormControl>
            <FormControl className="mt-4">
              <FormLabel htmlFor="teamName" className="!mb-0 !font-bold text-grayModern-700">
                团队名
              </FormLabel>
              <Input
                {...register('teamName', {})}
                className="!text-xl"
                id="teamName"
                variant="outline"
                placeholder="团队名"
              />
            </FormControl>
            <FormControl className="mt-4">
              <FormLabel htmlFor="maxSize" className="!mb-0 !font-bold text-grayModern-700">
                团队最大成员数
              </FormLabel>
              <Input
                {...register('maxSize', {})}
                className="!text-xl"
                id="maxSize"
                variant="outline"
                placeholder="团队最大成员数"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="text" onClick={onClose}>
              关闭
            </Button>
            <Button variant="confirm" onClick={handleSubmit(onSubmit)}>
              确定
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
