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
  useDisclosure
} from '@chakra-ui/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { POST } from '@/service/common/request';
import { useQueryClient } from '@tanstack/react-query';
import { AddIcon, EditIcon } from '@chakra-ui/icons';
import { useToast } from '@fastgpt/web/hooks/useToast';

export default function EditTeamModal(props: { data: any }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data } = props;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: data
  });

  const onSubmit = async (formData: any) => {
    POST(`/admin/routes/teams/updateTeam`, formData)
      .then((res) => {
        toast({
          title: '变更成功',
          status: 'success'
        });
        queryClient.invalidateQueries(['getTeams']);
        onClose();
      })
      .catch((err) => {
        toast({
          title: err.message,
          status: 'error'
        });
      });
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
              <FormLabel htmlFor="name" className="!mb-0 !font-bold text-grayModern-700">
                团队名
              </FormLabel>
              <Input
                {...register('name', {})}
                className="!text-xl"
                id="name"
                variant="outline"
                placeholder="团队名"
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
