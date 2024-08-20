import React, { useState } from 'react';
import { Box, Button, Flex, Popover, PopoverContent, PopoverTrigger } from '@chakra-ui/react';
import Navbar from './Navbar';
import MyIcon from '@fastgpt/web/components/common/Icon';
import { useSystem } from '@fastgpt/web/hooks/useSystem';

const Layout = ({ children }: { children: JSX.Element }) => {
  const { isPc } = useSystem();

  return (
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
  );
};

export default Layout;
