import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Navbar from './Navbar';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import Header from './Header';
import { useRouter } from 'next/router';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import dynamic from 'next/dynamic';

const ManualCopyModal = dynamic(() =>
  import('@fastgpt/web/hooks/useCopyData').then((mod) => mod.ManualCopyModal)
);
const LicenseInput = dynamic(() => import('@/components/common/License/Input'));
const Auth = dynamic(() => import('./Auth'));

const unLoginPage: Record<string, boolean> = {
  '/users/invoice': true
};

const Layout = ({ children }: { children: JSX.Element }) => {
  const router = useRouter();
  const { isPc } = useSystem();
  const { licenseData } = useSystemStore();

  const isUnLoginPage = unLoginPage[router.pathname];

  return (
    <>
      {isUnLoginPage && !licenseData ? (
        <Box p={5} h={'100%'} overflow={'auto'}>
          {children}
        </Box>
      ) : (
        <Auth>
          <Flex h={'100%'} bg={'myGray.100'} flexDirection={'column'}>
            <Header />
            <Flex w={'full'} flex={'1 0 0'} overflow={'auto'}>
              {isPc && (
                <Flex
                  h={'100%'}
                  flexDir={'column'}
                  p={2}
                  bg={'white'}
                  overflow={'auto'}
                  userSelect={'none'}
                  w={'217px'}
                >
                  <Navbar />
                </Flex>
              )}
              <Box flex={'1 0 0'} h={'100%'} overflow={'auto'} p={4}>
                {children}
              </Box>
            </Flex>
          </Flex>
        </Auth>
      )}

      <ManualCopyModal />
      {!licenseData && <LicenseInput />}
    </>
  );
};

export default Layout;
