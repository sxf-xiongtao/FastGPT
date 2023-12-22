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
import { AddIcon } from '@chakra-ui/icons';

type TFormData = {
  username: string;
  password: string;
};

export default function UserAddModal(props: { data: any }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data } = props;
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

  const onSubmit = async (formData: TFormData) => {
    try {
      await POST(`/admin/routes/users/addUser`, formData);
      toast({
        title: '添加成功',
        status: 'success',
        duration: 2000,
        isClosable: false,
        position: 'top'
      });
      queryClient.invalidateQueries(['getUsers']);
      onClose();
    } catch (error: any) {
      toast({
        title: error.message,
        status: 'error',
        duration: 2000,
        isClosable: false,
        position: 'top'
      });
    }
  };

  return (
    <>
      <Button
        className="ml-8 w-24 !h-8 mt-[2px]"
        variant="outline"
        leftIcon={<AddIcon boxSize={2} />}
        onClick={() => {
          onOpen();
          reset(data);
        }}
      >
        添加用户
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent m={'auto'}>
          <ModalHeader>添加用户</ModalHeader>
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
                {errors && !!errors?.password && (
                  <span className="ml-2 text-[12px] text-red-500">*必填</span>
                )}
              </FormLabel>
              <Input
                {...register('password', {
                  required: 'This is required'
                })}
                className="!text-xl"
                id="password"
                variant="outline"
                placeholder="密码"
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
