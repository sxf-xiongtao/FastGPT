import { Box, BoxProps } from '@chakra-ui/react';
import React from 'react';

const BoxCard = ({
  children,
  ...props
}: BoxProps & {
  children: React.ReactNode;
}) => {
  return (
    <Box
      px={[4, 6]}
      py={[4, 6]}
      borderRadius={['md', 'lg']}
      boxShadow={'2'}
      bg={'white'}
      {...props}
    >
      {children}
    </Box>
  );
};

export default BoxCard;
