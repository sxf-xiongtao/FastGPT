import React from 'react';
import { Box, Button, Flex, Popover, PopoverContent, PopoverTrigger } from '@chakra-ui/react';
import Navbar from './Navbar';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { GET } from '@/service/common/request';
import { LicenseDataType } from '@/types';
import { useConfirm } from '@fastgpt/web/hooks/useConfirm';
import { addDays } from 'date-fns';

const Layout = ({ children }: { children: JSX.Element }) => {
  const { isPc } = useSystem();
  const { openConfirm, ConfirmModal } = useConfirm({
    title: '过期提示',
    content: 'Lincense 距离过期不足 30 天, 请及时联系技术人员进行更新',
    type: 'common'
  });
  const { data: licenseData } = useRequest2(
    () => GET<LicenseDataType>('/admin/common/license/auth'),
    {
      manual: false,
      throttleWait: 1000 * 60 * 5,
      onSuccess: (data) => {
        const expTime = new Date(data.expTime);
        if (addDays(expTime, -30) < new Date()) openConfirm();
      }
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
              py={4}
            >
              Admin
            </Box>
            {licenseData && (
              <Flex direction="column">
                <Box>{licenseData.company}</Box>
                <Box>过期时间: {licenseData.expTime}</Box>
                <Box>最大用户: {licenseData.maxRegister}</Box>
              </Flex>
            )}
            <Navbar />
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
              </PopoverContent>
            </Popover>
          </Flex>
        )}
        <Box flex={'1 0 0'} h={'100%'} overflow={'auto'} py={[4, 6]} pl={[3, 3]} pr={[3, 6]}>
          {children}
        </Box>
      </Flex>
      <ConfirmModal />;
    </>
  );
};

export default Layout;
