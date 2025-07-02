import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@chakra-ui/react';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { POST } from '@/service/common/request';
import { useToast } from '@fastgpt/web/hooks/useToast';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { StandardSubLevelEnum, SubTypeEnum } from '@fastgpt/global/support/wallet/sub/constants';
import MySelect from '@fastgpt/web/components/common/MySelect';
import type { PlanType } from '@/pages/users/plans';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import MyDivider from '@fastgpt/web/components/common/MyDivider';

function transformDate(date: string) {
  const initialDate = new Date(date);
  const year = initialDate.getFullYear();
  const month = String(initialDate.getMonth() + 1).padStart(2, '0');
  const day = String(initialDate.getDate()).padStart(2, '0');
  const hours = String(initialDate.getHours()).padStart(2, '0');
  const minutes = String(initialDate.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function PlanEditModal(props: {
  data: PlanType;
  getData: any;
  subType: `${SubTypeEnum}`;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data, getData, subType } = props;
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm({
    defaultValues: data
  });

  const { runAsync: onSubmit, loading } = useRequest2(async (formData: PlanType) => {
    try {
      const startTimeISO = new Date(formData.startTime).toISOString();
      const expiredTimeISO = new Date(formData.expiredTime).toISOString();
      if (startTimeISO >= expiredTimeISO) {
        throw new Error('开始时间不能大于结束时间');
      }
      if (Number(formData.surplusPoints) > Number(formData.totalPoints)) {
        throw new Error('剩余积分不能大于总积分');
      }

      await POST(`/admin/routes/plans/updatePlan`, {
        ...formData,
        startTime: startTimeISO,
        expiredTime: expiredTimeISO
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
          reset({
            ...data,
            startTime: transformDate(data.startTime),
            expiredTime: transformDate(data.expiredTime)
          });
        }}
      >
        编辑
      </Button>

      <MyModal
        isOpen={isOpen}
        onClose={onClose}
        iconSrc={'support/account/plans'}
        title={'编辑套餐'}
        maxW={['90vw', '700px']}
      >
        <ModalBody>
          <FormControl mt={4}>
            <FormLabel htmlFor="startTime" className="!font-bold text-grayModern-700">
              开始时间
            </FormLabel>
            <Input
              size="md"
              type="datetime-local"
              {...register('startTime', {
                required: 'This is required'
              })}
            />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel htmlFor="expiredTime" className="!font-bold text-grayModern-700">
              结束时间
            </FormLabel>
            <Input
              size="md"
              type="datetime-local"
              {...register('expiredTime', {
                required: 'This is required'
              })}
            />
          </FormControl>
          {subType === SubTypeEnum.standard && (
            <>
              <FormControl mt={4}>
                <FormLabel htmlFor="level" className="!font-bold text-grayModern-700">
                  套餐等级
                </FormLabel>
                <Controller
                  control={control}
                  name="level"
                  render={({ field: { value, onChange } }) => (
                    <MySelect
                      h={10}
                      value={value}
                      onChange={onChange}
                      list={[
                        { label: '免费版', value: StandardSubLevelEnum.free },
                        { label: '体验版', value: StandardSubLevelEnum.experience },
                        { label: '团队版', value: StandardSubLevelEnum.team },
                        { label: '企业版', value: StandardSubLevelEnum.enterprise }
                      ]}
                    />
                  )}
                />
              </FormControl>
            </>
          )}
          {subType === SubTypeEnum.extraDatasetSize ? (
            <FormControl mt={4}>
              <FormLabel htmlFor="extraDatasetSize" className="!font-bold text-grayModern-700">
                额外知识库容量
                {errors && !!errors?.extraDatasetSize && (
                  <span className="ml-2 text-[12px] text-red-500">*必填</span>
                )}
              </FormLabel>
              <Input
                {...register('extraDatasetSize', {
                  required: 'This is required'
                })}
                className="!text-xl"
                id="metadata"
                variant="outline"
                placeholder="额外知识库容量"
                type="number"
              />
            </FormControl>
          ) : (
            <>
              <FormControl mt={4}>
                <FormLabel htmlFor="totalPoints" className="!font-bold text-grayModern-700">
                  总积分
                </FormLabel>
                <Input
                  {...register('totalPoints', {
                    required: 'This is required'
                  })}
                  className="!text-xl"
                  id="totalPoints"
                  variant="outline"
                  placeholder="总积分"
                  type="number"
                />
              </FormControl>
              <FormControl mt={4}>
                <FormLabel htmlFor="surplusPoints" className="!font-bold text-grayModern-700">
                  剩余积分
                </FormLabel>
                <Input
                  {...register('surplusPoints', {
                    required: 'This is required'
                  })}
                  className="!text-xl"
                  id="surplusPoints"
                  variant="outline"
                  placeholder="剩余积分"
                  type="number"
                />
              </FormControl>
            </>
          )}
          {subType === SubTypeEnum.standard && (
            <>
              <MyDivider />
              <Box mt={4}>下面的值会覆盖套餐配置，不填则会用套餐的标准值</Box>
              <FormControl>
                <FormLabel htmlFor="totalPoints" fontWeight={'bold'}>
                  团队成员上限
                </FormLabel>
                <Input
                  {...register('maxTeamMember')}
                  className="!text-xl"
                  id="totalPoints"
                  variant="outline"
                  type="number"
                />
              </FormControl>
              <FormControl mt={4}>
                <FormLabel htmlFor="totalPoints" fontWeight={'bold'}>
                  应用上限
                </FormLabel>
                <Input
                  {...register('maxApp')}
                  className="!text-xl"
                  id="totalPoints"
                  variant="outline"
                  type="number"
                />
              </FormControl>
              <FormControl mt={4}>
                <FormLabel htmlFor="totalPoints" fontWeight={'bold'}>
                  知识库上限
                </FormLabel>
                <Input
                  {...register('maxDataset')}
                  className="!text-xl"
                  id="totalPoints"
                  variant="outline"
                  type="number"
                />
              </FormControl>
            </>
          )}
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
