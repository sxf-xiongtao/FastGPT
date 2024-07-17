import {
  Button,
  FormControl,
  FormLabel,
  Input,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@chakra-ui/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { POST } from '@/service/common/request';
import { useToast } from '@fastgpt/web/hooks/useToast';
import MyModal from '@fastgpt/web/components/common/MyModal';

export default function EditTeamModal(props: { data: any; updateData: any }) {
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

  const onSubmit = async (formData: any) => {
    POST(`/admin/routes/teams/updateTeam`, formData)
      .then((res) => {
        toast({
          title: '变更成功',
          status: 'success'
        });
        updateData();
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

      <MyModal isOpen={isOpen} onClose={onClose} maxW={['90vw', '700px']} title={'团队编辑'}>
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
          <Button variant="outline" mr={4} onClick={onClose}>
            关闭
          </Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)}>
            确定
          </Button>
        </ModalFooter>
      </MyModal>
    </>
  );
}
