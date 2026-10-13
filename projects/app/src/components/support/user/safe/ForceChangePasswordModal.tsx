'use client';
import { useCallback, useState } from 'react';
import { Box, Button, FormControl, FormErrorMessage, Input, Text, VStack } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useForm } from 'react-hook-form';
import { UserErrEnum } from '@fastgpt/global/common/error/code/user';
import { getErrResponse } from '@fastgpt/global/common/error/utils';
import { checkPasswordRule } from '@fastgpt/global/common/string/password';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useUserStore } from '@/web/support/user/useUserStore';
import { forceUpdatePassword } from '@/web/support/user/account/password/api';

type FormType = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const invalidInputStyles = {
  borderColor: 'red.500',
  _focus: {
    borderColor: 'red.500',
    boxShadow: '0 0 0 1px var(--chakra-colors-red-500)'
  },
  _focusVisible: {
    borderColor: 'red.500',
    boxShadow: '0 0 0 1px var(--chakra-colors-red-500)'
  }
};

/**
 * 不可关闭的强制改密弹窗：账号处于 mustChangePassword 状态时，登录后必须先改密。
 *
 * 交互与常规改密的差别只有两点：**不可关闭**，以及旧密码校验由本服务端完成
 * （不走 pro 的验证流程，因此社区版同样可用）。其余「旧密码 / 新密码 / 确认密码」
 * 三项与常规改密一致。
 *
 * 刻意不复用 PasswordChangeModal：后者的验证阶段完全由 pro 的 authorization /
 * verification 接口驱动，社区版会走到不可关闭的「验证方式不可用」并把用户锁死；
 * 且它是五态状态机、无单测覆盖。
 */
const ForceChangePasswordModal = ({ onFinish }: { onFinish: () => void }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { initUserInfo } = useUserStore();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors }
  } = useForm<FormType>({
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' }
  });

  const submit = useCallback(
    async ({ oldPassword, newPassword }: FormType) => {
      setSubmitting(true);
      try {
        await forceUpdatePassword({ oldPassword, newPassword });
        reset();
        // 必须刷新 userInfo：mustChangePassword 挂在 userInfo 上，
        // 不刷新会让编排锁释放后弹窗立即重新弹出。
        await initUserInfo();
        toast({ status: 'success', title: t('common:password_set_success') });
        onFinish();
      } catch (error) {
        const errorResponse = getErrResponse(error);
        // 标记已被别处清除（例如另一个标签页已完成改密）时，本弹窗不可关闭，
        // 只弹通用错误会把用户彻底卡死。这里刷新状态并释放编排锁。
        if (errorResponse?.statusText === UserErrEnum.passwordChangeAuthorizationInvalid) {
          reset();
          await initUserInfo();
          onFinish();
          return;
        }
        const errorTitle =
          errorResponse?.statusText === UserErrEnum.newPasswordSameAsOld
            ? t('common:user.Password has no change')
            : errorResponse?.statusText === UserErrEnum.oldPasswordError
              ? t('common:user.Old password is error')
              : t('common:password_update_error');
        toast({ status: 'error', title: errorTitle });
      } finally {
        setSubmitting(false);
      }
    },
    [initUserInfo, onFinish, reset, t, toast]
  );

  return (
    <MyModal
      isOpen
      isCentered
      w="400px"
      maxW={['calc(100vw - 32px)', '400px']}
      borderRadius="semilg"
      boxShadow="3.5"
      overflow="hidden"
      closeOnOverlayClick={false}
    >
      <Box p={8}>
        <Text fontSize="lg" fontWeight="medium" lineHeight="26px">
          {t('common:password_force_change_title')}
        </Text>
        <Text mt={2} fontSize="sm" lineHeight="20px">
          {t('common:password_force_change_tip')}
        </Text>
        <VStack align="stretch" spacing={6} mt={6}>
          <FormControl isInvalid={!!errors.oldPassword}>
            <Input
              size="lg"
              type="password"
              bg="myGray.50"
              _invalid={invalidInputStyles}
              placeholder={t('common:password_old_placeholder')}
              aria-label={t('common:password_old_placeholder')}
              {...register('oldPassword', {
                required: t('common:password_old_placeholder')
              })}
            />
            {errors.oldPassword?.message && (
              <FormErrorMessage mt={2} fontSize="mini" lineHeight={4}>
                {errors.oldPassword.message}
              </FormErrorMessage>
            )}
          </FormControl>
          <FormControl isInvalid={!!errors.newPassword}>
            <Input
              size="lg"
              type="password"
              bg="myGray.50"
              _invalid={invalidInputStyles}
              placeholder={t('common:password_new_placeholder')}
              aria-label={t('common:password_new_placeholder')}
              {...register('newPassword', {
                required: t('common:password_new_placeholder'),
                validate: (value) => checkPasswordRule(value) || t('common:password_tip')
              })}
            />
            <Text
              mt={2}
              color={errors.newPassword ? 'red.500' : 'myGray.400'}
              fontSize="mini"
              fontWeight="medium"
              lineHeight={4}
            >
              {t('common:password_tip')}
            </Text>
          </FormControl>
          <FormControl isInvalid={!!errors.confirmPassword}>
            <Input
              size="lg"
              type="password"
              bg="myGray.50"
              _invalid={invalidInputStyles}
              placeholder={t('common:password_confirm_placeholder')}
              aria-label={t('common:password_confirm_placeholder')}
              {...register('confirmPassword', {
                required: t('common:password_confirm_placeholder'),
                validate: (value) =>
                  value === getValues('newPassword') || t('common:password_not_match')
              })}
            />
            {errors.confirmPassword?.message && (
              <FormErrorMessage mt={2} fontSize="mini" lineHeight={4}>
                {errors.confirmPassword.message}
              </FormErrorMessage>
            )}
          </FormControl>
          <Button
            size="lg"
            w="100%"
            fontSize="sm"
            isLoading={submitting}
            onClick={handleSubmit(submit)}
          >
            {t('common:password_confirm_action')}
          </Button>
        </VStack>
      </Box>
    </MyModal>
  );
};

export default ForceChangePasswordModal;
