'use client';
import React, { useMemo, useState } from 'react';
import { Box, Flex, HStack, Switch, Input, Textarea } from '@chakra-ui/react';
import { formatConfigStore2FormSchema, formatFormData2ConfigStore } from '@/web/core/config/adapt';
import type { ConfigFormType, ConfigStoreType } from '@/global/admin/config';
import { getInitFormData, postUpdateConfig } from '@/web/core/config/api';
import FormLabel from './components/FormLabel';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { serviceSideProps } from '@/web/common/i18n/utils';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import FirstTitle from '@/pageComponents/Settings/FirstTitle';
import SettingPage from '@/pageComponents/Settings/SettingPage';
import SecondTitle from '@/pageComponents/Settings/SecondTitle';
import FormItem from '@/pageComponents/Settings/FormItem';

const StandardPlans = dynamic(() => import('./components/FormField/StandardPlans'));
interface titleType {
  mainTitle: string;
  subTitles: string[];
}

let defaultStandardValue =
  '{"free":{"name":"免费版","price":0,"pointPrice":0,"totalPoints":100,"maxTeamMember":1,"maxAppAmount":10,"maxDatasetAmount":10,"chatHistoryStoreDuration":30,"maxDatasetSize":600,"trainingWeight":1,"permissionCustomApiKey":false,"permissionCustomCopyright":false,"permissionWebsiteSync":false,"permissionTeamOperationLog":false},"experience":{"name":"体验版","price":59,"pointPrice":30,"totalPoints":3000,"maxTeamMember":3,"maxAppAmount":30,"maxDatasetAmount":30,"chatHistoryStoreDuration":180,"maxDatasetSize":5000,"trainingWeight":2,"permissionCustomApiKey":true,"permissionCustomCopyright":false,"permissionWebsiteSync":true,"permissionTeamOperationLog":false},"team":{"name":"团队版","price":399,"pointPrice":200,"totalPoints":20000,"maxTeamMember":10,"maxAppAmount":100,"maxDatasetAmount":100,"chatHistoryStoreDuration":360,"maxDatasetSize":40000,"trainingWeight":3,"permissionCustomApiKey":true,"permissionCustomCopyright":true,"permissionWebsiteSync":true,"permissionTeamOperationLog":true},"enterprise":{"name":"企业版","price":999,"pointPrice":600,"totalPoints":60000,"maxTeamMember":100,"maxAppAmount":500,"maxDatasetAmount":500,"chatHistoryStoreDuration":720,"maxDatasetSize":150000,"trainingWeight":4,"permissionCustomApiKey":true,"permissionCustomCopyright":true,"permissionWebsiteSync":true,"permissionTeamOperationLog":true}}';

export const ModelSettings = () => {
  const [rawData, setRawData] = useState<ConfigFormType>();

  const { setValue, reset, watch, register, handleSubmit, getValues } =
    useForm<ConfigFormType['paySettings']>();

  const [openPlan, setOpenPlan] = useState<boolean>(false);

  const { loading: loadingConfig } = useRequest2(getInitFormData, {
    onSuccess: (data: ConfigStoreType) => {
      const aggregatedConfigs: ConfigFormType = formatConfigStore2FormSchema(data);
      setRawData(aggregatedConfigs);
      reset(aggregatedConfigs.paySettings);

      if (
        !!aggregatedConfigs.paySettings.subPlans &&
        aggregatedConfigs.paySettings.subPlans.standard !== '{}'
      ) {
        setOpenPlan(true);
      } else {
        setOpenPlan(false);
      }
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
        paySettings: data
      })
    );
  });

  const isLoading = loadingConfig || loadingSave;
  const titles: Array<titleType> = useMemo(
    () => [
      {
        mainTitle: '订阅套餐',
        subTitles: [
          ...(openPlan ? ['标准订阅套餐'] : []),
          ...(openPlan ? ['自定义套餐说明'] : []),
          ...(openPlan ? ['知识库存储费用（xx元/1000条/月）'] : []),
          ...(openPlan ? ['额外AI积分费用（xx元/1000积分/月）'] : [])
        ]
      },
      {
        mainTitle: '支付方式',
        subTitles: ['微信支付配置', '支付宝支付配置', '对公支付消息提示']
      }
    ],
    [openPlan]
  );

  return (
    <SettingPage titles={titles} loading={isLoading} onSubmit={onSubmit}>
      <FirstTitle title="订阅套餐" />
      <Box px={6} pt={5} pb={openPlan ? 0 : 5}>
        <HStack>
          <Box>是否启用订阅套餐</Box>
          <Switch
            isChecked={openPlan}
            onChange={(e) => {
              const val = e.target.checked;
              if (val) {
                setValue('subPlans.standard', defaultStandardValue);
                setOpenPlan(true);
              } else {
                const standard = getValues('subPlans.standard');
                defaultStandardValue = standard;

                setValue('subPlans.standard', '{}');
                setOpenPlan(false);
              }
            }}
          />
        </HStack>
      </Box>
      {openPlan && (
        <>
          <Box
            key={'标准订阅套餐'}
            px={6}
            py={6}
            mb={4}
            _notLast={{
              borderBottomWidth: '1.5px',
              borderBottomColor: 'myGray.200'
            }}
          >
            <Flex pl={2} flexWrap={'wrap'}>
              <Box w="100%" _notFirst={{ mt: 5 }}>
                <FormLabel title="标准订阅套餐" description="" mb={2} />
                <StandardPlans
                  value={watch(`subPlans.standard`)}
                  onChange={(val) => {
                    setValue(`subPlans.standard`, val);
                  }}
                />
              </Box>
            </Flex>
          </Box>
          <FormItem
            title="自定义套餐说明"
            description="如果填写了该地址，会覆盖系统上套餐页面，会跳转到这个自定义页面，你可以在自定义页面里定义收费规则"
          >
            <Input
              {...register('subPlans.planDescriptionUrl')}
              placeholder="如果填写了该地址，会覆盖系统上套餐页面，会跳转到这个自定义页面，你可以在自定义页面里定义收费规则"
            />
          </FormItem>
          <FormItem title="知识库存储费用（xx元/1000条/月）">
            <Input {...register('subPlans.extraDatasetSizePrice')} />
          </FormItem>
          <FormItem title="额外AI积分费用（xx元/1000积分/月）">
            <Input {...register('subPlans.extraPointsPrice')} />
          </FormItem>
        </>
      )}

      <FirstTitle title="支付方式" />
      <SecondTitle title="微信支付配置" />
      <FormItem
        title="appid"
        description="微信支付相关材料\nhttps://pay.weixin.qq.com/index.php/core/home/login?return_url=https%3A%2F%2Fpay.weixin.qq.com%2Findex.php%2Fextend%2Femployee\n自行注册微信支付，目前需要wx扫码支付\nappid: ![](/config/appid.png)"
      >
        <Input
          {...register('wx.WX_APPID')}
          placeholder="微信支付相关材料\nhttps://pay.weixin.qq.com/index.php/core/home/login?return_url=https%3A%2F%2Fpay.weixin.qq.com%2Findex.php%2Fextend%2Femployee\n自行注册微信支付，目前需要wx扫码支付\nappid: ![](/config/appid.png)"
        />
      </FormItem>
      <FormItem title="Merchant ID" description="![](/config/wx_mchid.png)">
        <Input {...register('wx.WX_MCHID')} placeholder="![](/config/wx_mchid.png)" />
      </FormItem>

      <FormItem title="V3 Code" description="![](/config/ws_v3_code.png)">
        <Input {...register('wx.WX_V3_CODE')} placeholder="![](/config/ws_v3_code.png)" />
      </FormItem>

      <FormItem title="Notify URL" description="没用到，随便填个">
        <Input {...register('wx.WX_NOTIFY_URL')} placeholder="没用到，随便填个" />
      </FormItem>

      <FormItem
        title="Serial Number"
        description="点管理证书进去看到\n![](/config/wx_serial_no.png)"
      >
        <Input
          {...register('wx.WX_SERIAL_NO')}
          placeholder="点管理证书进去看到\n![](/config/wx_serial_no.png)"
        />
      </FormItem>

      <FormItem
        title="Private Key"
        description="按微信教程拿到这几个文件，txt打开key\n![](/config/wx_private_key.png)"
      >
        <Textarea
          {...register('wx.WX_PRIVATE_KEY')}
          variant="outline"
          rows={8}
          whiteSpace="pre-wrap"
          wordBreak={'break-word'}
          placeholder="按微信教程拿到这几个文件，txt打开key\n![](/config/wx_private_key.png)"
        />
      </FormItem>
      <SecondTitle title="支付宝支付配置" />
      <FormItem
        title="appid"
        description="支付宝支付相关材料\nhttps://open.alipay.com/develop/manage\n自行注册支付宝应用，目前需要开通电脑网站支付"
      >
        <Input
          {...register('alipay.APP_ID')}
          placeholder="支付宝支付相关材料\nhttps://open.alipay.com/develop/manage\n自行注册支付宝应用，目前需要开通电脑网站支付"
        />
      </FormItem>
      <FormItem
        title="Private Key"
        description="点接口加签方式后选择证书加密方式，具体操作参考\nhttps://opendocs.alipay.com/common/056zub?pathHash=91c49771\n"
      >
        <Textarea
          {...register('alipay.APP_PRIVATE_KEY')}
          variant="outline"
          rows={8}
          whiteSpace="pre-wrap"
          wordBreak={'break-word'}
          placeholder="点接口加签方式后选择证书加密方式，具体操作参考\nhttps://opendocs.alipay.com/common/056zub?pathHash=91c49771\n"
        />
      </FormItem>
      <FormItem title="应用公钥证书" description="参考上面私钥获取文档">
        <Textarea
          {...register('alipay.APP_CERT_CONTENT')}
          variant="outline"
          rows={8}
          whiteSpace="pre-wrap"
          wordBreak={'break-word'}
          placeholder="参考上面私钥获取文档"
        />
      </FormItem>
      <FormItem title="支付宝根证书" description="参考上面私钥获取文档">
        <Textarea
          {...register('alipay.ALIPAY_ROOT_CERT_CONTENT')}
          variant="outline"
          rows={8}
          whiteSpace="pre-wrap"
          wordBreak={'break-word'}
          placeholder="参考上面私钥获取文档"
        />
      </FormItem>
      <FormItem title="支付宝公钥证书" description="参考上面私钥获取文档">
        <Textarea
          {...register('alipay.ALIPAY_PUBLIC_CERT_CONTENT')}
          variant="outline"
          rows={8}
          whiteSpace="pre-wrap"
          wordBreak={'break-word'}
          placeholder="参考上面私钥获取文档"
        />
      </FormItem>
      <FormItem
        title="支付宝网关"
        description="支付宝网关，注意测试使用的沙箱环境是\nhttps://openapi-sandbox.dl.alipaydev.com/gateway.do\n，而生成环境是\nhttps://openapi.alipay.com/gateway.do\n"
      >
        <Input
          {...register('alipay.ALIPAY_GATEWAY')}
          placeholder="支付宝网关，注意测试使用的沙箱环境是\nhttps://openapi-sandbox.dl.alipaydev.com/gateway.do\n，而生成环境是\nhttps://openapi.alipay.com/gateway.do\n"
        />
      </FormItem>
      <FormItem
        title="Endpoint"
        description="支付宝端点，注意测试使用的沙箱环境是\nhttps://openapi-sandbox.dl.alipaydev.com\n，而生成环境是\nhttps://openapi.alipay.com\n"
      >
        <Input
          {...register('alipay.ALIPAY_ENDPOINT')}
          placeholder="支付宝端点，注意测试使用的沙箱环境是\nhttps://openapi-sandbox.dl.alipaydev.com\n，而生成环境是\nhttps://openapi.alipay.com\n"
        />
      </FormItem>
      <FormItem title="Notify URL" description="没用到，随便填个">
        <Input {...register('alipay.ALIPAY_NOTIFY_URL')} placeholder="没用到，随便填个" />
      </FormItem>
      <SecondTitle title="对公支付消息提示" />
      <FormItem title="消息提示" description="支持markdown格式">
        <Textarea
          {...register('bank.description')}
          variant="outline"
          rows={8}
          whiteSpace="pre-wrap"
          wordBreak={'break-word'}
        />
      </FormItem>
    </SettingPage>
  );
};

export default ModelSettings;

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content, ['user']))
    }
  };
}
