import { Box, Flex } from '@chakra-ui/react';
import FormLabel from './FormLabel';

function FormItem({
  children,
  title,
  description
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  return (
    <Flex mx="8" mb="4" flexDirection={'column'}>
      {title && <FormLabel title={title} description={description} mb={2} />}
      <Box>{children} </Box>
    </Flex>
  );
}

export default FormItem;
