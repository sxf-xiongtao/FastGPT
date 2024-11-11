import { getLicenseData } from '@/web/admin/common/api';
import { Box } from '@chakra-ui/react';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import React from 'react';

const LicenseData = () => {
  const { data: licenseData } = useRequest2(getLicenseData, {
    manual: false
  });
  return licenseData ? (
    <Box p={4} fontSize={'xs'} color={'myGray.500'} borderTop={'base'}>
      <Box>{licenseData.company}</Box>
      <Box>过期时间: {licenseData.expTime}</Box>
      <Box>最大用户: {licenseData.maxRegister}</Box>
    </Box>
  ) : null;
};

export default LicenseData;
