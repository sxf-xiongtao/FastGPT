import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import SlideBar from './SlideBar';

const Layout = ({ children }: { children: JSX.Element }) => {
  return (
    <Flex h={'100%'} bg={'myGray.50'}>
      <SlideBar />
      <Box flex={'1 0 0'} h={'100%'} overflow={'auto'}>
        <Box h={'100%'} overflow={'overlay'} bg={'white'} py={5} px={8}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
};

export default Layout;
