import React, { useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import { serviceSideProps } from '@/utils/web/i18n';
import { strIsLink } from '@fastgpt/global/common/string/tools';

const Home = () => {
  console.log(strIsLink('sdsds'), '===');

  return <Box>这是FastGPT Pro</Box>;
};
export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content))
    }
  };
}

export default Home;
