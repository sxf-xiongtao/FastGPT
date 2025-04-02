import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  useMediaQuery,
  Switch,
  Input,
  Textarea,
  Divider
} from '@chakra-ui/react';

import { formatConfigStore2FormSchema, formatFormData2ConfigStore } from '@/web/core/config/adapt';
import type { ConfigFormType, ConfigStoreType } from '@/global/admin/config';
import { getInitFormData, postUpdateConfig } from '@/web/core/config/api';
import { useForm } from 'react-hook-form';
import { serviceSideProps } from '@/web/common/i18n/utils';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import FirstTitle from '@/pageComponents/Settings/FirstTitle';
import SettingPage from '@/pageComponents/Settings/SettingPage';
import FormItem from '@/pageComponents/Settings/FormItem';

interface titleType {
  mainTitle: string;
  subTitles: string[];
}

export const ModelSettings = () => {
  const [rawData, setRawData] = useState<ConfigFormType>();

  const { reset, register, handleSubmit } = useForm<ConfigFormType['securitySettings']>();

  const { loading: loadingConfig } = useRequest2(getInitFormData, {
    onSuccess: (data: ConfigStoreType) => {
      const aggregatedConfigs: ConfigFormType = formatConfigStore2FormSchema(data);
      setRawData(aggregatedConfigs);
      reset(aggregatedConfigs.securitySettings);
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
        securitySettings: data
      })
    );
  });

  const isLoading = loadingConfig || loadingSave;
  const titles: Array<titleType> = [
    {
      mainTitle: '内容安全审查',
      subTitles: ['百度安全 id', '百度安全 secret', '自定义安全校验 URL']
    }
  ];
  return (
    <SettingPage titles={titles} loading={isLoading} onSubmit={onSubmit}>
      <FirstTitle title="内容安全审查" />
      <Box mt={4}></Box>
      <FormItem
        title="百度安全 id"
        description="![](https://oss.laf.dev/lk63dw-fastgpt/baidu_censor.png)\nhttps://console.bce.baidu.com/ai/?_=1693133074333#/ai/antiporn/overview/index 注册百度安全校验账号，并创建对应应用。提供应用的 id 和 secret"
      >
        <Input
          {...register('censor.BAIDU_TEXT_CENSOR_CLIENTID')}
          placeholder="![](https://oss.laf.dev/lk63dw-fastgpt/baidu_censor.png)\nhttps://console.bce.baidu.com/ai/?_=1693133074333#/ai/antiporn/overview/index 注册百度安全校验账号，并创建对应应用。提供应用的 id 和 secret"
        />
      </FormItem>
      <Divider my="4" />
      <FormItem title="百度安全 secret" description="">
        <Input {...register('censor.BAIDU_TEXT_CENSOR_CLIENTSECRET')} placeholder="" />
      </FormItem>
      <Divider my="4" />
      <FormItem
        title="自定义安全校验 URL"
        description="如果您有自己的安全校验服务，可以填写该地址，并在安全设置中开启自定义安全校验"
      >
        <Input
          {...register('censor.customCensorURL')}
          placeholder="如果您有自己的安全校验服务，可以填写该地址，并在安全设置中开启自定义安全校验"
        />
        <Box mt={4}></Box>
      </FormItem>
    </SettingPage>
  );
};

export default ModelSettings;

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content))
    }
  };
}
