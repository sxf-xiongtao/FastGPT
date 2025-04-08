import React, { useState } from 'react';
import { Box, Divider, Flex } from '@chakra-ui/react';
import { formatConfigStore2FormSchema, formatFormData2ConfigStore } from '@/web/core/config/adapt';
import type { ConfigFormType, ConfigStoreType } from '@/global/admin/config';
import { getInitFormData, postUpdateConfig } from '@/web/core/config/api';
import { useForm } from 'react-hook-form';
import MyIcon from '@fastgpt/web/components/common/Icon';
import FirstTitle from '@/pageComponents/Settings/FirstTitle';
import SettingPage from '@/pageComponents/Settings/SettingPage';
import SecondTitle from '@/pageComponents/Settings/SecondTitle';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import Switch from '@/pageComponents/Settings/Switch';
import ThirdPartyVariables from './components/FormField/ThirdPartyVariables';
import FormLabel from './components/FormLabel';
import ThirdPartyAccountItem from './components/FormField/ThirdPartyAccountItem';
interface titleType {
  mainTitle: string;
  subTitles: string[];
}

export const Settings = () => {
  const [rawData, setRawData] = useState<ConfigFormType>();

  const { setValue, reset, watch, handleSubmit, control } = useForm<ConfigFormType>();

  const { loading: loadingConfig } = useRequest2(getInitFormData, {
    onSuccess: (data: ConfigStoreType) => {
      const aggregatedConfigs = formatConfigStore2FormSchema(data);
      setRawData(aggregatedConfigs);

      reset({
        ...aggregatedConfigs,
        externalProviderSettings: {
          externalProviderWorkflowVariables:
            aggregatedConfigs.externalProviderSettings?.externalProviderWorkflowVariables || []
        }
      });
    },
    errorToast: '获取配置出错',
    manual: false
  });

  const { loading: loadingSave, runAsync: saveConfig } = useRequest2(postUpdateConfig, {
    manual: true,
    successToast: '保存成功',
    errorToast: '保存失败'
  });

  const onSubmit = handleSubmit((data) => {
    if (!rawData) {
      return;
    }
    saveConfig(
      formatFormData2ConfigStore({
        ...rawData,
        externalProviderSettings: {
          ...rawData.externalProviderSettings,
          externalProviderWorkflowVariables:
            data.externalProviderSettings.externalProviderWorkflowVariables
        },
        siteSettings: {
          ...rawData.siteSettings,
          feConfigs: {
            ...rawData.siteSettings.feConfigs,
            show_openai_account: data.siteSettings.feConfigs.show_openai_account,
            lafEnv: data.siteSettings.feConfigs.lafEnv
          }
        }
      })
    );
  });

  const isLoading = loadingConfig || loadingSave;
  const titles: Array<titleType> = [
    {
      mainTitle: '第三方账号配置',
      subTitles: ['允许用户配置账号', '自定义工作流变量']
    }
  ];

  return (
    <SettingPage titles={titles} loading={isLoading} onSubmit={onSubmit}>
      <Flex bg={'myGray.100'} alignItems={'center'}>
        <FirstTitle title="第三方账号配置" />
        <Flex
          color={'primary.600'}
          alignItems={'center'}
          cursor={'pointer'}
          onClick={() => {
            window.open(
              'https://fael3z0zfze.feishu.cn/wiki/KOWaw6jkui5E3ekdOhvce4O9n4g?from=from_copylink'
            );
          }}
        >
          <MyIcon name="book" w={'14px'} mr={1} />
          <Box fontSize={'mini'} fontWeight={'medium'}>
            查看文档
          </Box>
        </Flex>
      </Flex>
      <SecondTitle title="允许用户配置账号" />

      <Flex px={6} alignItems={'center'} my={3}>
        <FormLabel title="OpenAI/OneAPI 账号" description="" mb={2} minW={'240px'} />
        <Switch control={control} name="siteSettings.feConfigs.show_openai_account" />
      </Flex>
      <Flex px={6}>
        <FormLabel title="laf 账号" mb={2} minW={'240px'} />
        <ThirdPartyAccountItem
          value={watch('siteSettings.feConfigs.lafEnv') || ''}
          onChange={(val) => {
            setValue('siteSettings.feConfigs.lafEnv', val);
          }}
          description="请输入 laf 地址"
        />
      </Flex>
      <Divider mt="4" />
      <Box p={6}>
        <ThirdPartyVariables
          value={watch(`externalProviderSettings.externalProviderWorkflowVariables`)}
          onChange={(val) => {
            setValue(`externalProviderSettings.externalProviderWorkflowVariables`, val);
          }}
          title="自定义工作流变量"
        />
      </Box>
    </SettingPage>
  );
};

export default Settings;
