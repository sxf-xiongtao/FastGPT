import {
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Input,
  ModalBody,
  ModalFooter,
  Switch
} from '@chakra-ui/react';
import {
  StandardSubLevelEnum,
  standardSubLevelMap
} from '@fastgpt/global/support/wallet/sub/constants';
import type {
  StandSubPlanLevelMapType,
  TeamStandardSubPlanItemType
} from '@fastgpt/global/support/wallet/sub/type';
import { useTranslation } from 'next-i18next';
import React, { useMemo, useState } from 'react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import { useForm } from 'react-hook-form';
import MyModal from '@fastgpt/web/components/common/MyModal';
import FormLabel from '@fastgpt/web/components/common/MyBox/FormLabel';
import MyNumberInput from '@fastgpt/web/components/common/Input/NumberInput';

const StandardPlanContentList = ({
  planMap,
  level
}: {
  planMap: StandSubPlanLevelMapType;
  level: `${StandardSubLevelEnum}`;
}) => {
  const { t } = useTranslation();

  const planContent = useMemo(() => {
    const plan = planMap?.[level];

    if (!plan) return;
    return {
      price: plan.price,
      level: level as `${StandardSubLevelEnum}`,
      ...standardSubLevelMap[level as `${StandardSubLevelEnum}`],
      maxTeamMember: plan.maxTeamMember,
      maxAppAmount: plan.maxAppAmount,
      maxDatasetAmount: plan.maxDatasetAmount,
      chatHistoryStoreDuration: plan.chatHistoryStoreDuration,
      maxDatasetSize: plan.maxDatasetSize,
      permissionCustomApiKey: plan.permissionCustomApiKey,
      permissionCustomCopyright: plan.permissionCustomCopyright,
      trainingWeight: plan.trainingWeight,
      totalPoints: plan.totalPoints,
      permissionWebsiteSync: plan.permissionWebsiteSync,
      permissionTeamOperationLog: plan.permissionTeamOperationLog
    };
  }, [level, planMap]);

  return planContent ? (
    <Grid gap={4} fontSize={'sm'}>
      <Flex alignItems={'center'}>
        <MyIcon name={'price/right'} w={'16px'} mr={3} />
        <Box color={'myGray.600'}>
          {t('common:support.wallet.subscription.function.Max members', {
            amount: planContent.maxTeamMember
          })}
        </Box>
      </Flex>
      <Flex alignItems={'center'}>
        <MyIcon name={'price/right'} w={'16px'} mr={3} />
        <Box color={'myGray.600'}>
          {t('common:support.wallet.subscription.function.Max app', {
            amount: planContent.maxAppAmount
          })}
        </Box>
      </Flex>
      <Flex alignItems={'center'}>
        <MyIcon name={'price/right'} w={'16px'} mr={3} />
        <Box color={'myGray.600'}>
          {t('common:support.wallet.subscription.function.Max dataset', {
            amount: planContent.maxDatasetAmount
          })}
        </Box>
      </Flex>
      <Flex alignItems={'center'}>
        <MyIcon name={'price/right'} w={'16px'} mr={3} />
        <Box color={'myGray.600'}>
          {t('common:support.wallet.subscription.function.History store', {
            amount: planContent.chatHistoryStoreDuration
          })}
        </Box>
      </Flex>
      <Flex alignItems={'center'}>
        <MyIcon name={'price/right'} w={'16px'} mr={3} />
        <Box fontWeight={'bold'}>
          {t('common:support.wallet.subscription.function.Max dataset size', {
            amount: planContent.maxDatasetSize
          })}
        </Box>
      </Flex>
      <Flex alignItems={'center'}>
        <MyIcon name={'price/right'} w={'16px'} mr={3} />
        <Flex alignItems={'center'}>
          <Box fontWeight={'bold'}>
            {t('common:support.wallet.subscription.function.Points', {
              amount: planContent.totalPoints
            })}
          </Box>
          <QuestionTip
            ml={1}
            label={t('common:support.wallet.subscription.AI points click to read tip')}
          ></QuestionTip>
        </Flex>
      </Flex>
      <Flex alignItems={'center'}>
        <MyIcon name={'price/right'} w={'16px'} mr={3} />
        <Box color={'myGray.600'}>
          {t('common:support.wallet.subscription.Training weight', {
            weight: planContent.trainingWeight
          })}
        </Box>
      </Flex>
      {!!planContent.permissionWebsiteSync && (
        <Flex alignItems={'center'}>
          <MyIcon name={'price/right'} w={'16px'} mr={3} />
          <Box color={'myGray.600'}>{t('common:support.wallet.subscription.web_site_sync')}</Box>
        </Flex>
      )}
      {!!planContent.permissionTeamOperationLog && (
        <Flex alignItems={'center'}>
          <MyIcon name={'price/right'} w={'16px'} mr={3} />
          <Box color={'myGray.600'}>
            {t('common:support.wallet.subscription.team_operation_log')}
          </Box>
        </Flex>
      )}
    </Grid>
  ) : null;
};

const EditPlanModal = ({
  level,
  planMap,
  onClose,
  onChange
}: {
  level: `${StandardSubLevelEnum}`;
  planMap: StandSubPlanLevelMapType;
  onClose: () => void;
  onChange: (e: string) => void;
}) => {
  const { t } = useTranslation();
  const { register, handleSubmit, watch, setValue } = useForm({ defaultValues: planMap[level] });
  const label = planMap?.[level].name || t(standardSubLevelMap[level].label);
  const permissionWebsiteSync = watch('permissionWebsiteSync');
  const permissionTeamOperationLog = watch('permissionTeamOperationLog');

  const onSubmit = (data: TeamStandardSubPlanItemType) => {
    onChange(
      JSON.stringify({
        ...planMap,
        [level]: data
      })
    );
    onClose();
  };

  return (
    <MyModal
      isOpen
      iconSrc="modal/edit"
      title={`编辑 ${label} 套餐`}
      isCentered
      w={'500px'}
      maxH={'90vh'}
    >
      <ModalBody>
        <HStack>
          <FormLabel flex={'0 0 150px'}>套餐名称</FormLabel>
          <Input
            flex={'1 0 0'}
            bg={'myGray.50'}
            value={watch('name')}
            onChange={(e) => {
              // @ts-ignore
              setValue('name', e.target.value ?? '');
            }}
            placeholder={'自定义套餐名，可覆盖原套餐名'}
          />
        </HStack>
        <HStack mt={3}>
          <FormLabel flex={'0 0 150px'}>每月价格</FormLabel>
          <MyNumberInput
            flex={'1 0 0'}
            bg={'myGray.50'}
            value={watch('price')}
            min={0}
            onChange={(e) => {
              // @ts-ignore
              setValue('price', e ?? '');
            }}
          />
        </HStack>
        <HStack mt={3}>
          <FormLabel flex={'0 0 150px'}>最大团队成员</FormLabel>
          <MyNumberInput
            flex={'1 0 0'}
            bg={'myGray.50'}
            value={watch('maxTeamMember')}
            min={0}
            onChange={(e) => {
              // @ts-ignore
              setValue('maxTeamMember', e ?? '');
            }}
          />
        </HStack>
        <HStack mt={3}>
          <FormLabel flex={'0 0 150px'}>最大APP数量</FormLabel>
          <MyNumberInput
            flex={'1 0 0'}
            bg={'myGray.50'}
            value={watch('maxAppAmount')}
            min={0}
            onChange={(e) => {
              // @ts-ignore
              setValue('maxAppAmount', e ?? '');
            }}
          />
        </HStack>
        <HStack mt={3}>
          <FormLabel flex={'0 0 150px'}>最大知识库数量</FormLabel>
          <MyNumberInput
            flex={'1 0 0'}
            bg={'myGray.50'}
            value={watch('maxDatasetAmount')}
            min={0}
            onChange={(e) => {
              // @ts-ignore
              setValue('maxDatasetAmount', e ?? '');
            }}
          />
        </HStack>
        <HStack mt={3}>
          <FormLabel flex={'0 0 150px'}>历史记录保存多少天</FormLabel>
          <MyNumberInput
            flex={'1 0 0'}
            bg={'myGray.50'}
            value={watch('chatHistoryStoreDuration')}
            min={0}
            onChange={(e) => {
              // @ts-ignore
              setValue('chatHistoryStoreDuration', e ?? '');
            }}
          />
        </HStack>
        <HStack mt={3}>
          <FormLabel flex={'0 0 150px'}>最大知识库索引数量</FormLabel>
          <MyNumberInput
            flex={'1 0 0'}
            bg={'myGray.50'}
            value={watch('maxDatasetSize')}
            min={0}
            onChange={(e) => {
              // @ts-ignore
              setValue('maxDatasetSize', e ?? '');
            }}
          />
        </HStack>
        <HStack mt={3}>
          <FormLabel flex={'0 0 150px'}>每月 AI 积分</FormLabel>
          <MyNumberInput
            flex={'1 0 0'}
            bg={'myGray.50'}
            value={watch('totalPoints')}
            min={0}
            onChange={(e) => {
              // @ts-ignore
              setValue('totalPoints', e ?? '');
            }}
          />
        </HStack>
        <HStack mt={3}>
          <FormLabel flex={'0 0 150px'}>训练优先级(高的优先)</FormLabel>
          <MyNumberInput
            flex={'1 0 0'}
            bg={'myGray.50'}
            value={watch('trainingWeight')}
            min={0}
            max={5}
            onChange={(e) => {
              // @ts-ignore
              setValue('trainingWeight', e ?? '');
            }}
          />
        </HStack>
        <HStack mt={3}>
          <FormLabel flex={'0 0 150px'}>允许使用站点同步</FormLabel>
          <Switch
            isChecked={permissionWebsiteSync}
            onChange={(e) => {
              setValue('permissionWebsiteSync', e.target.checked);
            }}
          />
        </HStack>
        <HStack mt={3}>
          <FormLabel flex={'0 0 150px'}>允许团队操作日志</FormLabel>
          <Switch
            isChecked={permissionTeamOperationLog}
            onChange={(e) => {
              setValue('permissionTeamOperationLog', e.target.checked);
            }}
          />
        </HStack>
      </ModalBody>
      <ModalFooter>
        <Button mr={4} variant={'whiteBase'} onClick={onClose}>
          取消
        </Button>
        <Button onClick={handleSubmit(onSubmit)}>确认</Button>
      </ModalFooter>
    </MyModal>
  );
};

const StandardPlans = ({
  value = '{}',
  onChange
}: {
  value?: string;
  onChange: (value: string) => void;
}) => {
  const { t } = useTranslation();

  const [editedLevel, setEditedLevel] = useState<`${StandardSubLevelEnum}`>();

  const planMap = useMemo(() => {
    try {
      return JSON.parse(value) as StandSubPlanLevelMapType;
    } catch (error) {
      return {} as StandSubPlanLevelMapType;
    }
  }, [value]);
  const planList = useMemo(() => {
    return [
      {
        level: StandardSubLevelEnum.free,
        ...standardSubLevelMap[StandardSubLevelEnum.free],
        label: planMap['free']?.name || t(standardSubLevelMap[StandardSubLevelEnum.free].label),
        price: planMap['free']?.price,
        maxTeamMember: planMap['free']?.maxTeamMember,
        maxAppAmount: planMap['free']?.maxAppAmount,
        maxDatasetAmount: planMap['free']?.maxDatasetAmount,
        chatHistoryStoreDuration: planMap['free']?.chatHistoryStoreDuration,
        maxDatasetSize: planMap['free']?.maxDatasetSize,
        permissionCustomApiKey: planMap['free']?.permissionCustomApiKey,
        permissionCustomCopyright: planMap['free']?.permissionCustomCopyright,
        trainingWeight: planMap['free']?.trainingWeight,
        totalPoints: planMap['free']?.totalPoints,
        permissionWebsiteSync: planMap['free']?.permissionWebsiteSync,
        permissionTeamOperationLog: planMap['free']?.permissionTeamOperationLog
      },
      {
        level: StandardSubLevelEnum.experience,
        ...standardSubLevelMap[StandardSubLevelEnum.experience],
        label:
          planMap['experience']?.name ||
          t(standardSubLevelMap[StandardSubLevelEnum.experience].label),
        price: planMap['experience']?.price,
        maxTeamMember: planMap['experience']?.maxTeamMember,
        maxAppAmount: planMap['experience']?.maxAppAmount,
        maxDatasetAmount: planMap['experience']?.maxDatasetAmount,
        chatHistoryStoreDuration: planMap['experience']?.chatHistoryStoreDuration,
        maxDatasetSize: planMap['experience']?.maxDatasetSize,
        permissionCustomApiKey: planMap['experience']?.permissionCustomApiKey,
        permissionCustomCopyright: planMap['experience']?.permissionCustomCopyright,
        trainingWeight: planMap['experience']?.trainingWeight,
        totalPoints: planMap['experience']?.totalPoints,
        permissionWebsiteSync: planMap['experience']?.permissionWebsiteSync,
        permissionTeamOperationLog: planMap['experience']?.permissionTeamOperationLog
      },
      {
        level: StandardSubLevelEnum.team,
        ...standardSubLevelMap[StandardSubLevelEnum.team],
        label: planMap['team']?.name || t(standardSubLevelMap[StandardSubLevelEnum.team].label),
        price: planMap['team']?.price,
        maxTeamMember: planMap['team']?.maxTeamMember,
        maxAppAmount: planMap['team']?.maxAppAmount,
        maxDatasetAmount: planMap['team']?.maxDatasetAmount,
        chatHistoryStoreDuration: planMap['team']?.chatHistoryStoreDuration,
        maxDatasetSize: planMap['team']?.maxDatasetSize,
        permissionCustomApiKey: planMap['team']?.permissionCustomApiKey,
        permissionCustomCopyright: planMap['team']?.permissionCustomCopyright,
        trainingWeight: planMap['team']?.trainingWeight,
        totalPoints: planMap['team']?.totalPoints,
        permissionWebsiteSync: planMap['team']?.permissionWebsiteSync,
        permissionTeamOperationLog: planMap['team']?.permissionTeamOperationLog
      },
      {
        level: StandardSubLevelEnum.enterprise,
        ...standardSubLevelMap[StandardSubLevelEnum.enterprise],
        label:
          planMap['enterprise']?.name ||
          t(standardSubLevelMap[StandardSubLevelEnum.enterprise].label),
        price: planMap['enterprise']?.price,
        maxTeamMember: planMap['enterprise']?.maxTeamMember,
        maxAppAmount: planMap['enterprise']?.maxAppAmount,
        maxDatasetAmount: planMap['enterprise']?.maxDatasetAmount,
        chatHistoryStoreDuration: planMap['enterprise']?.chatHistoryStoreDuration,
        maxDatasetSize: planMap['enterprise']?.maxDatasetSize,
        permissionCustomApiKey: planMap['enterprise']?.permissionCustomApiKey,
        permissionCustomCopyright: planMap['enterprise']?.permissionCustomCopyright,
        trainingWeight: planMap['enterprise']?.trainingWeight,
        totalPoints: planMap['enterprise']?.totalPoints,
        permissionWebsiteSync: planMap['enterprise']?.permissionWebsiteSync,
        permissionTeamOperationLog: planMap['enterprise']?.permissionTeamOperationLog
      }
    ];
  }, [planMap, t]);
  console.log(planMap);
  // const openPlan = !!value && value !== '{}';

  return (
    <>
      <Grid mt={5} gridTemplateColumns={'repeat(2,1fr)'} gap={8} w={'100%'} minH={'550px'}>
        {planList.map((item) => {
          return (
            <Box
              key={item.level}
              flex={'1 0 0'}
              bg={'rgba(255, 255, 255, 0.90)'}
              p={'28px'}
              borderRadius={'2xl'}
              boxShadow={'1.5'}
              border={'base'}
            >
              <HStack fontSize={'md'} fontWeight={'500'}>
                <Box>{item.label}</Box>

                <Box fontSize={'lg'} fontWeight={'bold'}>
                  ￥{item.price}
                </Box>
              </HStack>

              {/* Button */}
              <Button
                my={3}
                mx={'auto'}
                onClick={() => {
                  setEditedLevel(item.level);
                }}
              >
                点击配置套餐
              </Button>

              {/* function list */}
              <StandardPlanContentList level={item.level} planMap={planMap} />
            </Box>
          );
        })}

        {!!editedLevel && (
          <EditPlanModal
            level={editedLevel}
            planMap={planMap}
            onChange={onChange}
            onClose={() => {
              setEditedLevel(undefined);
            }}
          />
        )}
      </Grid>
    </>
  );
};

export default React.memo(StandardPlans);
