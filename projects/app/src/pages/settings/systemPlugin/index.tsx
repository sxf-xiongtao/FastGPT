import React, { useMemo, useState } from 'react';
import BoxCard from '@/components/common/BoxContainer/Card';
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
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { getSystemPlugins, putUpdateSystemPlugin } from '@/web/core/app/plugin/api';
import MyBox from '@fastgpt/web/components/common/MyBox';
import Avatar from '@fastgpt/web/components/common/Avatar';
import Tag from '@fastgpt/web/components/common/Tag';
import { SystemPluginTemplateItemType } from '@fastgpt/global/core/workflow/type';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useFieldArray, useForm } from 'react-hook-form';
import QuestionTip from '@fastgpt/web/components/common/MyTooltip/QuestionTip';
import MyNumberInput from '@fastgpt/web/components/common/Input/NumberInput/index';
import { useTranslation } from 'next-i18next';
import { FlowNodeTemplateTypeEnum } from '@fastgpt/global/core/workflow/constants';
import type { getSystemPluginsResponse } from '@/pages/api/core/app/plugin/getSystemPlugins';

const getTemplates = () => [
  {
    type: FlowNodeTemplateTypeEnum.tools,
    label: '工具',
    list: []
  },
  {
    type: FlowNodeTemplateTypeEnum.search,
    label: '搜索',
    list: []
  },
  {
    type: FlowNodeTemplateTypeEnum.multimodal,
    label: '多模态',
    list: []
  },
  {
    type: FlowNodeTemplateTypeEnum.other,
    label: '其他',
    list: []
  }
];

const SystemPlugin = () => {
  const { t } = useTranslation();
  const { data: plugins = [], run: refreshPlugins } = useRequest2(getSystemPlugins, {
    manual: false
  });
  const [configPlugin, setConfigPlugin] = useState<SystemPluginTemplateItemType>();

  const formatPlugins = useMemo(() => {
    const copy = getTemplates().map<{
      type: FlowNodeTemplateTypeEnum;
      label: string;
      list: getSystemPluginsResponse;
    }>((item) => ({
      type: item.type,
      label: item.label,
      list: []
    }));

    plugins.forEach((item) => {
      const index = copy.findIndex((template) => template.type === item.templateType);
      if (index === -1) return;
      copy[index].list.push(item);
    });
    return copy.filter((item) => item.list.length > 0);
  }, [plugins]);

  return (
    <>
      <BoxCard>
        <Box fontSize={'xl'}>系统插件配置</Box>
        <Box fontSize={'sm'} color="myGray.600">
          以下系统插件的具体运行逻辑已封装好，你可以按需启用它们。部分系统插件是需要申请并配置对应的
          API key，请根据提示去申请和填写后启用。系统插件允许你配置按调用次数进行积分扣费。
        </Box>
      </BoxCard>
      {/* container */}
      <Box mt={4}>
        {formatPlugins.map((item) => (
          <Box key={item.type} _notLast={{ mb: 4 }}>
            <Box fontWeight={'bold'} color={'myGray.900'}>
              {item.label}
            </Box>
            <Grid
              mt={2}
              gap={4}
              gridTemplateColumns={['1fr', 'repeat(2,1fr)', 'repeat(2,1fr)', 'repeat(3,1fr)']}
            >
              {item.list.map((plugin) => (
                <MyBox
                  key={plugin.id}
                  display={'flex'}
                  flexDirection={'column'}
                  py={3}
                  px={5}
                  cursor={'pointer'}
                  borderWidth={1.5}
                  bg={'white'}
                  borderRadius={'md'}
                  minH={'130px'}
                  position={'relative'}
                  _hover={{
                    boxShadow: '2',
                    borderColor: 'primary.300'
                  }}
                  onClick={() => setConfigPlugin(plugin)}
                >
                  <Flex alignItems={'center'} h={'38px'}>
                    <Avatar src={plugin.avatar} borderRadius={'md'} w={'28px'} />
                    <Box mx={3} className="textEllipsis3" flex={'1 0 0'}>
                      {plugin.name}
                    </Box>
                    {plugin.isActive ? (
                      <Tag colorSchema="green">已启用</Tag>
                    ) : (
                      <Tag colorSchema={'gray'}>未启用</Tag>
                    )}
                  </Flex>
                  <Box fontSize={'sm'} pt={3}>
                    {plugin.intro}
                  </Box>
                </MyBox>
              ))}
            </Grid>
          </Box>
        ))}
      </Box>

      {!!configPlugin && (
        <PluginConfigModal
          plugin={configPlugin}
          onSuccess={refreshPlugins}
          onClose={() => setConfigPlugin(undefined)}
        />
      )}
    </>
  );
};

export default SystemPlugin;

function PluginConfigModal({
  plugin,
  onSuccess,
  onClose
}: {
  plugin: SystemPluginTemplateItemType;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { register, getValues, setValue, control, watch, handleSubmit } = useForm({
    defaultValues: plugin
  });
  const originCost = watch('originCost');

  const { fields: inputs } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormProvider)
    name: 'inputConfig' // unique name for your Field Array
  });

  const { runAsync: onSubmit, loading } = useRequest2(
    async (e: SystemPluginTemplateItemType) => {
      return putUpdateSystemPlugin({
        pluginId: plugin.id,
        isActive: e.isActive,
        originCost: e.originCost,
        currentCost: e.currentCost,
        inputConfig: e.inputConfig
      }).then(onSuccess);
    },
    {
      successToast: '配置成功',
      onSuccess() {
        onClose();
      }
    }
  );

  return (
    <MyModal isOpen title={`${plugin.name}配置`} iconSrc={plugin.avatar} onClose={onClose}>
      <ModalBody>
        <HStack>
          <Box flex={1}>是否启用</Box>
          <Switch {...register('isActive')} />
        </HStack>
        <Box mt={5}>
          <HStack>
            <Box position={'relative'}>价格（n 积分/次）</Box>
          </HStack>
          <Box mt={1}>
            <MyNumberInput
              value={originCost ?? 0}
              onChange={(e) => setValue('originCost', e ?? 0)}
              step={0.01}
            />
          </Box>
        </Box>
        {inputs?.map((item, i) => (
          <Box key={item.key} mt={5}>
            <HStack>
              <Box position={'relative'}>
                <Box position={'absolute'} color={'red.600'} left={'-2'} top={'-1'}>
                  *
                </Box>
                {item.label}
              </Box>
              {item.description && <QuestionTip label={item.description} />}
            </HStack>
            <Box mt={1}>
              <Input bg={'myGray.50'} {...register(`inputConfig.${i}.value`, { required: true })} />
            </Box>
          </Box>
        ))}
      </ModalBody>
      <ModalFooter>
        <Button isLoading={loading} onClick={handleSubmit(onSubmit)}>
          确认
        </Button>
      </ModalFooter>
    </MyModal>
  );
}
