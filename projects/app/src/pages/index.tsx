import React, { useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import { serviceSideProps } from '@/utils/i18n';
import { strIsLink } from '@fastgpt/common/tools/str';

const Home = () => {
  console.log(strIsLink('sdsds'), '===');

  return null;
};
export async function getServerSideProps(content: any) {
  return {
    props: {
      ...(await serviceSideProps(content))
    }
  };
}

export default Home;
