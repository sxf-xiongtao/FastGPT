import { useRouter } from 'next/router';
import { useAdminStore } from '@/store/useAdminStore';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';

const unAuthPage: { [key: string]: boolean } = {
  '/': true,
  '/login': true,
  '/users/invoice': true
};

const Auth = ({ children }: { children: JSX.Element | React.ReactNode }) => {
  const router = useRouter();
  const { adminInfo, initAdminInfo } = useAdminStore();

  useRequest2(
    async () => {
      if (unAuthPage[router.pathname] === true || adminInfo) {
        return null;
      }
      return await initAdminInfo();
    },
    {
      manual: false,
      refreshDeps: [router.pathname],
      onError(error) {
        console.log('error->', error);
        router.replace(
          `/login?lastRoute=${encodeURIComponent(location.pathname + location.search)}`
        );
      }
    }
  );

  return !!adminInfo || unAuthPage[router.pathname] === true ? <>{children}</> : null;
};

export default Auth;
