import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { POST } from '@/service/common/request';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { serviceSideProps } from '@fastgpt/web/common/system/nextjs';
import { useTranslation } from 'next-i18next';
import { useToast } from '@fastgpt/web/hooks/useToast';

type FormData = {
  account: string;
  password: string;
};

const Login = () => {
  const [isShowPassword, setIsShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      account: '',
      password: ''
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const response: any = await POST(`/admin/support/user/login`, {
        username: data.account,
        password: hashStr(data.password)
      });

      if (response.token) {
        localStorage.setItem('token', response.token);
        router.push('/dashboard');
        toast({
          title: '登录成功',
          status: 'success'
        });
      }
    } catch (error: any) {
      toast({
        title: error.message,
        status: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#F8F8F8] absolute top-0 bottom-0 left-0 right-0">
      <div
        className="w-[450px] h-[540px] absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-[16px] bg-white px-12 pt-16"
        style={{ boxShadow: '0px 14px 53px  rgba(84, 85, 144, 0.16)' }}
      >
        <div className="mb-12 text-[24px] text-center font-medium text-[#245373]">管理员登录</div>
        <FormControl className="mb-10 flex flex-col">
          <FormLabel className="text-[#245373] font-medium" htmlFor="account">
            用户名
          </FormLabel>
          <Input {...register('account', { required: true })} id="account" placeholder={''} />
        </FormControl>
        <FormControl isInvalid={!!errors.password} className="mb-16 flex flex-col">
          <FormLabel className="text-[#245373] font-medium" htmlFor="password">
            密码
          </FormLabel>
          <InputGroup>
            <Input
              type={isShowPassword ? 'text' : 'password'}
              {...register('password', { required: true })}
              id="password"
              placeholder={''}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(onSubmit)();
                }
              }}
            />
            <InputRightElement>
              {isShowPassword ? (
                <ViewOffIcon className="cursor-pointer" onClick={() => setIsShowPassword(false)} />
              ) : (
                <ViewIcon className="cursor-pointer" onClick={() => setIsShowPassword(true)} />
              )}
            </InputRightElement>
          </InputGroup>
        </FormControl>
        <Button
          type="submit"
          onClick={handleSubmit(onSubmit)}
          isLoading={isLoading}
          variant="primary"
          className="w-full"
        >
          登录
        </Button>
      </div>
    </div>
  );
};

export async function getServerSideProps(context: any) {
  return {
    props: { ...(await serviceSideProps(context)) }
  };
}

export default Login;
