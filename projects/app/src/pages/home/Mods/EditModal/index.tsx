import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure
} from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { POST } from '@/service/common/request';
import { useQueryClient } from '@tanstack/react-query';

export default function EditModal(props: {
  children: React.ReactElement;
  data: any;
  isCreate?: boolean;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { children, data, isCreate } = props;
  const queryClient = useQueryClient();

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
      const res: any = await POST(`/admin/routes/users/updateUser`, formData);
      if (!res.error) {
        queryClient.invalidateQueries(['getUsers']);
        onClose();
      }
    } else {
      const res: any = await POST(`/admin/routes/users/addUser`, formData);
      if (!res.error) {
        onClose();
      }
    }
  };

  return (
    <>
      {React.cloneElement(children, {
        onClick: (e: any) => {
          e.stopPropagation();
          reset(data);
          onOpen();
        }
      })}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent m={'auto'}>
          <ModalHeader>{isCreate ? '添加' : '更改'}</ModalHeader>
          <ModalBody>
            <FormControl>
              <FormLabel htmlFor="username" className="!mb-0 !font-bold text-grayModern-700">
                用户名
                {!!errors.username && <span className="ml-2 text-[12px] text-red-500">*必填</span>}
              </FormLabel>
              <Input
                {...register('username', {
                  required: 'This is required'
                })}
                className="!text-xl"
                id="username"
                variant="outline"
                placeholder={data.username}
              />
            </FormControl>
            <FormControl className="mt-4">
              <FormLabel htmlFor="password" className="!mb-0 !font-bold text-grayModern-700">
                密码
                {!!errors.username && isCreate && (
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
                placeholder={isCreate ? '' : '∗∗∗∗∗∗∗∗'}
              />
            </FormControl>
            <FormControl className="mt-4">
              <FormLabel htmlFor="balance" className="!mb-0 !font-bold text-grayModern-700">
                余额
                {!!errors.username && <span className="ml-2 text-[12px] text-red-500">*必填</span>}
              </FormLabel>
              <Input
                {...register('balance', {
                  required: 'This is required'
                })}
                className="!text-xl"
                id="balance"
                variant="outline"
                placeholder={data.balance}
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
                placeholder={data.teamName}
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
                placeholder={data.maxSize}
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
