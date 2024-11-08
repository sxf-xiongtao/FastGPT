import React from 'react';
import { Box, Button, Flex, Popover, PopoverContent, PopoverTrigger } from '@chakra-ui/react';
import Navbar from './Navbar';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { GET } from '@/service/common/request';
import { LicenseDataType } from '@/types';

const Layout = ({ children }: { children: JSX.Element }) => {
  const { isPc } = useSystem();
  const { data: licenseData } = useRequest2(
    () => GET<LicenseDataType>('/admin/common/license/auth'),
    {
      manual: false,
      throttleWait: 1000 * 60 * 5
    }
  );
  return (
    <>
      <Flex h={'100%'} bg={'myGray.100'} flexDirection={['column', 'row']}>
        {isPc ? (
          <Flex h={'100%'} flexDir={'column'} px={3}>
            <Box
              textAlign={'center'}
              fontSize={'2xl'}
              color={'primary.600'}
              fontWeight={'bold'}
              pt={4}
            >
              Admin
            </Box>
            <Navbar />
            {licenseData && (
              <Flex direction="column">
                <Box>{licenseData.company}</Box>
                <Box>过期时间: {licenseData.expTime}</Box>
                <Box>最大用户: {licenseData.maxRegister}</Box>
              </Flex>
            )}
          </Flex>
        ) : (
          <Flex justifyContent={'space-between'} alignItems={'center'} px={8}>
            <Box
              textAlign={'center'}
              fontSize={'2xl'}
              color={'primary.600'}
              fontWeight={'bold'}
              py={4}
            >
              Admin
            </Box>
            <Popover placement="bottom">
              <PopoverTrigger>
                <Button variant={'none'}>
                  <MyIcon name={'menu'} w={'24px'} h={'24px'} />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Navbar />
                {licenseData && (
                  <Box p={4}>
                    <Box>{licenseData.company}</Box>
                    <Box>过期时间: {licenseData.expTime}</Box>
                    <Box>最大用户: {licenseData.maxRegister}</Box>
                  </Box>
                )}
              </PopoverContent>
            </Popover>
          </Flex>
        )}
        <Box flex={'1 0 0'} h={'100%'} overflow={'auto'} py={[4, 6]} pl={[3, 3]} pr={[3, 6]}>
          {children}
        </Box>
      </Flex>
    </>
  );
};

export default Layout;
