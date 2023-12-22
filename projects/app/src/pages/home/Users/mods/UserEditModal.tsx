import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  useDisclosure,
  useToast
} from '@chakra-ui/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { POST } from '@/service/common/request';
import { useQueryClient } from '@tanstack/react-query';
import { EditIcon } from '@chakra-ui/icons';

type TFormData = {
  password: string;
  status: string;
};

export default function UserEditModal(props: { data: any }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data } = props;
  const queryClient = useQueryClient();
  const toast = useToast();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: data
  });

  const onSubmit = async (formData: TFormData) => {
    try {
      const res = await POST(`/admin/routes/users/updateUser`, formData);
      console.log(res);
      toast({
        title: '更新成功',
        status: 'success',
        duration: 2000,
        isClosable: false,
        position: 'top'
      });
      queryClient.invalidateQueries(['getUsers']);
      onClose();
    } catch (err: any) {
      toast({
        title: err.message,
        status: 'error',
        duration: 2000,
        isClosable: false,
        position: 'top'
      });
    }
  };

  return (
    <>
      <span
        className="p-1 flex items-center justify-center rounded hover:bg-slate-100 cursor-pointer"
        onClick={() => {
          onOpen();
          reset(data);
        }}
      >
        <EditIcon className="text-[14px]" />
      </span>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent m={'auto'}>
          <ModalHeader>更改</ModalHeader>
          <ModalBody>
            <FormControl className="mt-4">
              <FormLabel htmlFor="password" className="!mb-0 !font-bold text-grayModern-700">
                密码
              </FormLabel>
              <Input
                {...register('password')}
                className="!text-xl"
                id="password"
                variant="outline"
                placeholder="∗∗∗∗∗∗∗∗"
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
