import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useMediaQuery
} from '@chakra-ui/react';
import SlideBar from './SlideBar';
import MyIcon from '@fastgpt/web/components/common/Icon';

const Layout = ({ children }: { children: JSX.Element }) => {
  const [isMobile] = useMediaQuery('(max-width: 768px)');

  return (
    <Flex h={'100%'} bg={'myGray.50'} flexDirection={isMobile ? 'column' : 'row'}>
      {!isMobile ? (
        <SlideBar showTitle />
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
              <SlideBar />
            </PopoverContent>
          </Popover>
        </Flex>
      )}
      <Box flex={'1 0 0'} h={'100%'} overflow={'auto'}>
        <Box h={'100%'} overflow={'overlay'} bg={'white'} py={5} px={8}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
};

export default Layout;
