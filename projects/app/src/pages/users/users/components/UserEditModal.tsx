import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  ModalBody,
  ModalFooter,
  Radio,
  RadioGroup,
  useDisclosure
} from '@chakra-ui/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { POST } from '@/service/common/request';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { useToast } from '@fastgpt/web/hooks/useToast';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';

type TFormData = {
  username: string;
  password: string;
  status: string;
};

export default function UserEditModal(props: { data: any; getData: any }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data, getData } = props;
  const { toast } = useToast();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: data
  });

  const { runAsync: onSubmit, loading } = useRequest2(async (formData: TFormData) => {
    try {
      await POST(`/admin/routes/users/updateUser`, {
        _id: data._id,
        username: formData.username,
        status: formData.status,
        password: formData.password ? hashStr(formData.password) : undefined
      });

      toast({
        title: '更新成功',
        status: 'success'
      });
      getData(1);
      onClose();
    } catch (err: any) {
      toast({
        title: err.message,
        status: 'error'
      });
    }
  });

  return (
    <>
      <Button
        variant={'whiteBase'}
        size={'sm'}
        onClick={() => {
          onOpen();
          reset(data);
        }}
      >
        编辑
      </Button>

      <MyModal isOpen={isOpen} onClose={onClose} title={'编辑用户'} maxW={['90vw', '700px']}>
        <ModalBody>
          <FormControl className="mt-4">
            <FormLabel htmlFor="username" className="!font-bold text-grayModern-700">
              用户名
            </FormLabel>
            <Input
              {...register('username')}
              className="!text-xl"
              id="username"
              variant="outline"
              placeholder=""
            />
          </FormControl>
          <FormControl className="mt-4">
            <FormLabel htmlFor="password" className="!font-bold text-grayModern-700">
              密码
            </FormLabel>
            <Input
              {...register('password')}
              className="!text-xl"
              id="password"
              variant="outline"
              placeholder="******"
            />
          </FormControl>
          <FormControl className="mt-4">
            <FormLabel htmlFor="password" className="!mb-0 !font-bold text-grayModern-700">
              用户状态
            </FormLabel>
            <RadioGroup defaultValue={data?.status}>
              <HStack spacing={6} mt={2}>
                <Radio {...register('status')} value="active" size="lg">
                  active
                </Radio>
                <Radio {...register('status')} value="forbidden" size="lg">
                  forbidden
                </Radio>
              </HStack>
            </RadioGroup>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant={'outline'} mr={4} onClick={onClose}>
            关闭
          </Button>
          <Button isLoading={loading} variant={'primary'} onClick={handleSubmit(onSubmit)}>
            确定
          </Button>
        </ModalFooter>
      </MyModal>
    </>
  );
}
