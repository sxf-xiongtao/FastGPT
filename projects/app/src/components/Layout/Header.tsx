import { Avatar, Box, Divider, Flex, HStack } from '@chakra-ui/react';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useRouter } from 'next/router';
import MyImage from '@fastgpt/web/components/common/Image/MyImage';
import Navbar from './Navbar';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import dynamic from 'next/dynamic';
import { useUserStore } from '@/web/support/user/useUserStore';
import { postLoginout } from '@/web/support/user/api';

const LicenseData = dynamic(() => import('./LicenseData'), { ssr: false });
const MyPopover = dynamic(() => import('@fastgpt/web/components/common/MyPopover'), { ssr: false });

export default function Header() {
  const { isPc } = useSystem();
  const router = useRouter();
  const { initLicenseData, clearLicenseData, licenseData } = useUserStore();

  useRequest2(initLicenseData, {
    manual: false
  });

  return (
    <Flex
      minH={'60px'}
      bg={'white'}
      borderBottom={'1px solid'}
      borderColor={'myGray.200'}
      px={[3, 6]}
      alignItems={'center'}
      zIndex={10}
    >
      {isPc ? (
        <Flex flex={1} alignItems={'center'} gap={3}>
          <MyImage src="/icon/admin.svg" alt="admin" w={'1.5rem'} />
          <Box fontWeight={'bold'} fontSize={'lg'}>
            Admin
          </Box>
        </Flex>
      ) : (
        <>
          <Flex justifyContent={'space-between'} alignItems={'center'} userSelect={'none'}>
            <MyPopover
              trigger="click"
              Trigger={
                <Box cursor={'pointer'}>
                  <MyIcon name={'menu'} w={'24px'} h={'24px'} />
                </Box>
              }
              placement="bottom"
            >
              {({ onClose }) => (
                <Box p={2} overflow={'auto'} maxH={'60vh'}>
                  <Navbar onClose={onClose} />
                </Box>
              )}
            </MyPopover>
          </Flex>
          <Box flex={1} />
        </>
      )}

      {licenseData && (
        <MyPopover
          trigger="hover"
          Trigger={
            <HStack>
              <Box fontSize={'sm'}>{licenseData?.company}</Box>
              <Avatar src="/icon/user.svg" w={9} h={9} />
            </HStack>
          }
          placement="bottom-end"
          w={'192px'}
        >
          {({ onClose }) => (
            <Box>
              <LicenseData licenseData={licenseData} />
              <Divider />
              <Flex
                px={1}
                py={2}
                mx={4}
                mt={1}
                mb={2}
                cursor={'pointer'}
                rounded={'xs'}
                fontWeight={'medium'}
                fontSize={'sm'}
                _hover={{ bg: 'myGray.05', color: 'primary.600' }}
                onClick={() => {
                  postLoginout().then(() => {
                    clearLicenseData();
                    router.replace('/login');
                    onClose();
                  });
                }}
              >
                <MyIcon name="support/account/loginoutLight" w={'18px'} mr={2} />
                退出登录
              </Flex>
            </Box>
          )}
        </MyPopover>
      )}
    </Flex>
  );
}
