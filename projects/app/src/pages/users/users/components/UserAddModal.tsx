import {
  Button,
  FormControl,
  FormLabel,
  Input,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { POST } from '@/service/common/request';
import { AddIcon } from '@chakra-ui/icons';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { useToast } from '@fastgpt/web/hooks/useToast';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { checkPasswordRule } from '@fastgpt/global/common/string/password';

type TFormData = {
  username: string;
  password: string;
};

export default function UserAddModal(props: { data: any; updateData: any }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data, updateData } = props;
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: data
  });

  const { runAsync: onSubmit, loading: isLoading } = useRequest2(
    (formData: TFormData) => {
      return POST(`/admin/routes/users/addUser`, {
        ...formData,
        password: hashStr(formData.password)
      });
    },
    {
      onSuccess() {
        updateData();
        onClose();
      },
      successToast: '添加成功'
    }
  );

  const onSubmitErr = (err: Record<string, any>) => {
    const val = Object.values(err)[0];
    if (!val) return;
    if (val.message) {
      toast({
        status: 'warning',
        title: val.message,
        duration: 3000,
        isClosable: true
      });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="!h-full"
        leftIcon={<AddIcon boxSize={2} />}
        onClick={() => {
          onOpen();
          reset(data);
        }}
      >
        添加用户
      </Button>

      <MyModal isOpen={isOpen} onClose={onClose} title={'添加用户'} maxW={['90vw', '700px']}>
        <ModalBody>
          <FormControl>
            <FormLabel htmlFor="username" className="!font-bold text-grayModern-700">
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
            <FormLabel htmlFor="password" className="!font-bold text-grayModern-700">
              密码
              {errors && !!errors?.password && (
                <span className="ml-2 text-[12px] text-red-500">*必填</span>
              )}
            </FormLabel>
            <Input
              {...register('password', {
                validate: (val) => {
                  if (!val) return true;
                  if (!checkPasswordRule(val)) {
                    return '密码至少 8 位，且至少包含两种组合：数字、字母或特殊字符';
                  }
                  return true;
                }
              })}
              variant="outline"
              placeholder="密码至少 8 位，且至少包含两种组合：数字、字母或特殊字符"
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={4} onClick={onClose}>
            关闭
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit, onSubmitErr)}
            isLoading={isLoading}
          >
            确定
          </Button>
        </ModalFooter>
      </MyModal>
    </>
  );
}
