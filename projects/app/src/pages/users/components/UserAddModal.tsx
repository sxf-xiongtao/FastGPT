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
import MyModal from '@/components/common/MyModal';

type TFormData = {
  username: string;
  password: string;
};

export default function UserAddModal(props: { data: any; updateData: any }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data, updateData } = props;
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
      await POST(`/admin/routes/users/addUser`, {
        ...formData,
        password: hashStr(formData.password)
      });
      setIsLoading(true);
      toast({
        title: '添加成功',
        status: 'success'
      });
      updateData();
      onClose();
    } catch (error: any) {
      toast({
        title: error.message,
        status: 'error'
      });
    }
    setIsLoading(false);
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
          <Button variant="outline" mr={4} onClick={onClose}>
            关闭
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} isLoading={isLoading}>
            确定
          </Button>
        </ModalFooter>
      </MyModal>
    </>
  );
}
