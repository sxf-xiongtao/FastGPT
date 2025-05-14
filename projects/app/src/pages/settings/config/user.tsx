'use client';
import type { ConfigFormType, ConfigStoreType } from '@/global/admin/config';
import { TeamModeEnum } from '@/global/settings/constants';
import FirstTitle from '@/pageComponents/Settings/FirstTitle';
import FormItem from '@/pageComponents/Settings/FormItem';
import ImageInput from '@/pageComponents/Settings/ImageInput';
import SecondTitle from '@/pageComponents/Settings/SecondTitle';
import SettingPage from '@/pageComponents/Settings/SettingPage';
import Switch from '@/pageComponents/Settings/Switch';
import { serviceSideProps } from '@/web/common/i18n/utils';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { formatConfigStore2FormSchema, formatFormData2ConfigStore } from '@/web/core/config/adapt';
import { getInitFormData, postUpdateConfig } from '@/web/core/config/api';
import { Box, Divider, Input, Textarea } from '@chakra-ui/react';
import MySelect from '@fastgpt/web/components/common/MySelect';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

interface titleType {
  mainTitle: string;
  subTitles: string[];
}

const UserSetting = () => {
  const [rawData, setRawData] = useState<ConfigFormType>();
  const { licenseData } = useSystemStore();

  const { setValue, reset, watch, register, handleSubmit, control } =
    useForm<ConfigFormType['loginSettings']>();

  const { loading: loadingConfig } = useRequest2(getInitFormData, {
    onSuccess: (data: ConfigStoreType) => {
      const aggregatedConfigs: ConfigFormType = formatConfigStore2FormSchema(data);
      setRawData(aggregatedConfigs);
      reset(aggregatedConfigs.loginSettings);
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
        loginSettings: data
      })
    );
  });

  const isLoading = loadingConfig || loadingSave;
  const hasSSOURL = !!watch('sso.url') && licenseData?.functions?.sso;
  const teamMode = watch('teamMode');
  const teamModeOptions = useMemo(
    () => [
      { label: '多团队模式', value: TeamModeEnum.multi },
      { label: '单团队模式', value: TeamModeEnum.single },
      ...(hasSSOURL ? [{ label: '同步模式', value: TeamModeEnum.sync }] : [])
    ],
    [hasSSOURL]
  );
  const titles: Array<titleType> = useMemo(
    () => [
      {
        mainTitle: '通知 & 登陆设置',
        subTitles: [
          '团队模式设置',
          ...(hasSSOURL ? ['自定义用户系统配置'] : []),
          '邮箱通知配置(注册、套餐通知)',
          '阿里云短信配置',
          '阿里云短信模板CODE（SMS_xxx）',
          ...(licenseData?.functions?.sso
            ? [
                '微信服务号登陆',
                'GitHub 登录配置',
                'Google 登陆配置',
                '微软登陆配置',
                '快速登陆（不推荐）'
              ]
            : [])
        ]
      }
    ],
    [hasSSOURL, licenseData?.functions?.sso]
  );

  return (
    <SettingPage titles={titles} loading={isLoading} onSubmit={onSubmit}>
      <FirstTitle title="通知登陆 & 设置" />
      <SecondTitle title="团队模式设置" description="![](/imgs/single-team-mode-intro.png)" />

      <FormItem>
        <MySelect<`${TeamModeEnum}`>
          value={teamMode}
          list={teamModeOptions}
          onChange={(val) => setValue('teamMode', val)}
        />
      </FormItem>

      <Divider mt="4" />
      {!!watch('sso.url') && (
        <>
          <SecondTitle title="自定义用户系统配置" />
          <FormItem
            title="用户服务根地址(末尾不加/)"
            description="具体用法请看： [SSO & 外部成员同步](https://doc.tryfastgpt.ai/docs/guide/admin/sso/)"
          >
            <Box>{watch('sso.url')}</Box>
          </FormItem>
          <FormItem title="SSO 登录按钮标题" description="配置 SSO 登录按钮的标题">
            <Input {...register('sso.title')} placeholder="SSO 登录按钮标题" />
          </FormItem>
          <FormItem title="SSO 登录按钮的图标" description="配置 SSO 登录按钮的图标">
            <ImageInput control={control} name="sso.icon" />
          </FormItem>
          <FormItem
            title="SSO 自动跳转"
            description="开启后，用户进入登录页面，将会自动触发 SSO 登录，无需手动点击。"
          >
            <Switch control={control} name="sso.autoLogin" />
          </FormItem>
        </>
      )}
      <Divider mt="4" />

      <SecondTitle title="邮箱通知配置(注册、套餐通知)" />
      <FormItem
        title="邮箱服务SMTP地址"
        description="不同厂商不一样\nQQ: smtp.qq.com\ngmail: smtp.gmail.com"
      >
        <Input {...register('email.smtp')} placeholder="邮箱服务SMTP地址" />
      </FormItem>
      <FormItem title="邮箱服务SMTP用户名" description="qq 邮箱为例，对应 qq 号">
        <Input {...register('email.user')} placeholder="邮箱服务SMTP用户名" />
      </FormItem>
      <FormItem title="邮箱 Password" description="SMTP 授权码">
        <Input {...register('email.pass')} placeholder="SMTP 授权码" />
      </FormItem>
      <FormItem title="是否开启邮箱注册" description="是否开启邮箱注册">
        <Switch control={control} name="email.register" />
      </FormItem>
      <Divider />
      <SecondTitle title="阿里云短信配置" />
      <FormItem
        title="ACCESSKEYID"
        description="阿里云短信参数\nhttps://dysms.console.aliyun.com/overview\n申请对应的签名和短信模板，提供：\nACCESSKEYID\nACCESSSECRET\n签名名称\n模板CODE，SM开头的"
      >
        <Input {...register('phone.SNED_PHONE_ACCESSKEYID')} placeholder="ACCESSKEYID" />
      </FormItem>
      <FormItem title="ACCESSSECRET" description="阿里云账号的secret key">
        <Input {...register('phone.SNED_PHONE_ACCESSSECRET')} placeholder="ACCESSSECRET" />
      </FormItem>
      <FormItem title="签名名称" description="短信签名">
        <Input {...register('phone.SNED_PHONE_SIGNNAME')} placeholder="签名名称" />
      </FormItem>

      <SecondTitle title="阿里云短信模板CODE（SMS_xxx）" />
      <FormItem title="注册账号" description="填写后，将会开启手机号注册">
        <Input {...register('sms.REGISTER')} placeholder="注册账号" />
      </FormItem>
      <FormItem title="重置密码" description="填写后，将会开启手机号找回密码">
        <Input {...register('sms.RESET_PASSWORD')} placeholder="重置密码" />
      </FormItem>
      <FormItem title="绑定通知手机号" description="填写后，将会允许手机号绑定通知方式">
        <Input {...register('sms.BIND_NOTIFICATION')} placeholder="绑定通知手机号" />
      </FormItem>
      <FormItem title="订阅套餐即将过期" description="填写后，套餐即将过期，会发送一个短信">
        <Input {...register('sms.EXPIRE_SOON')} placeholder="订阅套餐即将过期" />
      </FormItem>
      <FormItem title="免费版用户清理警告">
        <Input {...register('sms.FREE_CLEAN')} placeholder="免费版用户清理警告" />
      </FormItem>

      {licenseData?.functions?.sso && (
        <>
          <>
            <SecondTitle title="微信服务号登陆" />
            <FormItem
              title="AppID"
              description="服务号的 Appid。微信服务号的验证地址填写：商业版域名//api/support/user/account/login/wx/callback"
            >
              <Input {...register('wechat.appID')} placeholder="AppID" />
            </FormItem>
            <FormItem title="AppSecret" description="服务号的 Secret">
              <Input {...register('wechat.appSecret')} placeholder="AppSecret" />
            </FormItem>
          </>
          <>
            <SecondTitle title="GitHub 登录配置" />
            <FormItem
              title="GitHub Client ID"
              description="https://github.com/settings/developers，注册一个 oauth，\nHomepage: 域名\nCallbackurl: 域名/login/provider\n提供：\nclientId: \nclientSecret:"
            >
              <Input {...register('github.clientId')} placeholder="GitHub Client ID" />
            </FormItem>
            <FormItem title="GitHub Secret">
              <Input {...register('github.secret')} placeholder="GitHub Secret" />
            </FormItem>
          </>
          <>
            <Divider />
            <SecondTitle title="Google 登陆配置" />
            <FormItem title="Google Client ID">
              <Input {...register('google.clientId')} placeholder="Google Client ID" />
            </FormItem>
            <FormItem title="Google Secret">
              <Input {...register('google.secret')} placeholder="Google Secret" />
            </FormItem>
          </>
          <>
            <Divider />
            <SecondTitle title="微软登陆配置" />
            <FormItem
              title="Microsoft Client ID"
              description="对应 Microsoft 应用的「应用程序(客户端) ID」"
            >
              <Input {...register('microsoft.clientId')} placeholder="Microsoft Client ID" />
            </FormItem>
            <FormItem title="Microsoft Client Secret">
              <Input {...register('microsoft.secret')} placeholder="Microsoft Client Secret" />
            </FormItem>
            <FormItem
              title="Microsoft Tenant ID"
              description="对应 Microsoft 应用的「租户 ID」, 若使用默认的 common 可不用填写"
            >
              <Input {...register('microsoft.tenantId')} placeholder="Microsoft Tenant ID" />
            </FormItem>
            <FormItem
              title="自定义按钮名"
              description="自定义按钮的名称，若不填写则使用默认的 Microsoft 按钮"
            >
              <Input {...register('microsoft.customButton')} placeholder="自定义按钮名" />
            </FormItem>
          </>
          <>
            <Divider />
            <SecondTitle title="快速登陆（不推荐）" />
            <FormItem>
              <Textarea {...register('fastLogin')} placeholder="快速登陆（不推荐）" />
            </FormItem>
          </>
        </>
      )}
    </SettingPage>
  );
};

export default UserSetting;

export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content))
    }
  };
}
