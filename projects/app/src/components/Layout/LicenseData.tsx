import { LicenseDataType } from '@/types';
import { Box, Flex } from '@chakra-ui/react';
import Avatar from '@fastgpt/web/components/common/Avatar';
import React from 'react';

const LicenseData = ({ licenseData }: { licenseData?: LicenseDataType }) => {
  return licenseData ? (
    <Box p={4} pb={3}>
      <Flex gap={2}>
        <Avatar src="/icon/user.svg" w={6} h={6} />
        <Box fontSize={'sm'} color={'myGray.900'}>
          {licenseData.company}
        </Box>
      </Flex>
      <Flex mt={3} fontSize={'mini'}>
        <Box color={'myGray.500'} mr={1}>
          过期时间:
        </Box>
        <Box color={'myGray.600'}>{licenseData.expTime}</Box>
      </Flex>
      <Flex mt={2} fontSize={'mini'}>
        <Box color={'myGray.500'} mr={1}>
          最大用户:{' '}
        </Box>
        <Box color={'myGray.600'}>{licenseData.maxRegister}</Box>
      </Flex>
    </Box>
  ) : null;
};

export default LicenseData;
