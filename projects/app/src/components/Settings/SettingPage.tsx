import { throttle } from '@/utils/tools';
import { useEffect, useState } from 'react';
import BoxCard from '../common/BoxContainer/Card';
import { Box, Button, Flex } from '@chakra-ui/react';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import MyLoading from '@fastgpt/web/components/common/MyLoading';

interface titleType {
  mainTitle: string;
  subTitles: string[];
}

function SettingPage({
  titles,
  loading,
  children,
  onSubmit
}: {
  titles: Array<titleType>;
  loading?: boolean;
  children: React.ReactNode;
  onSubmit: () => void;
}) {
  const [activeTitle, setActiveTitle] = useState('');

  const handleScroll = throttle(() => {
    let firstVisibleTitle: any = null;

    titles.forEach((title: titleType) => {
      title.subTitles.forEach((subTitle: string) => {
        const subTitleElement = document.getElementById(subTitle);
        if (!subTitleElement) return;

        const subTitleRect = subTitleElement.getBoundingClientRect();
        if (subTitleRect.top <= window.innerHeight && subTitleRect.bottom >= 0) {
          if (
            !firstVisibleTitle ||
            subTitleRect.top < firstVisibleTitle.getBoundingClientRect().top
          ) {
            firstVisibleTitle = subTitleElement;
          }
        }
      });
    });

    if (firstVisibleTitle) {
      setActiveTitle(firstVisibleTitle.id);
    }
  }, 100);

  useEffect(() => {
    if (!activeTitle) setActiveTitle(titles[0].mainTitle);
  }, [activeTitle]);

  const { isPc } = useSystem();

  return (
    <>
      {loading && <MyLoading />}
      <Flex h={'100%'} gap={4}>
        <Box overflowY={'auto'} flex={'1 0 0'} onScroll={handleScroll}>
          <Box
            mb={10}
            border={'base'}
            borderRadius={'lg'}
            boxShadow={'3'}
            bg={'white'}
            overflow={'hidden'}
          >
            {children}
          </Box>
        </Box>
        <Flex
          flex={'0 0 200px'}
          flexDirection={'column'}
          position={isPc ? 'relative' : 'absolute'}
          gap={4}
        >
          <BoxCard
            flex={'1 0 0'}
            overflow={'overlay'}
            display={['none', 'block']}
            userSelect={'none'}
            px={4}
            py={4}
          >
            <Box>
              {titles.map((title: titleType) => (
                <Box key={title.mainTitle}>
                  <Box
                    {...(activeTitle === title.mainTitle
                      ? {
                          bg: 'primary.600',
                          color: 'white'
                        }
                      : {
                          _hover: {
                            color: 'primary.600'
                          },
                          onClick: () => {
                            const anchor = document.getElementById(title.mainTitle);
                            if (anchor) {
                              anchor.scrollIntoView({ behavior: 'auto', block: 'start' });
                            }
                          }
                        })}
                    py={1}
                    px={2}
                    borderRadius={'md'}
                    cursor={'pointer'}
                  >
                    {title.mainTitle}
                  </Box>
                  <Box ml={3} fontSize={'sm'}>
                    {title?.subTitles.map((subTitle: string) => (
                      <Box
                        key={subTitle}
                        {...(activeTitle === subTitle
                          ? {
                              bg: 'primary.600',
                              color: 'white'
                            }
                          : {
                              _hover: {
                                color: 'primary.600'
                              },
                              onClick: () => {
                                const anchor = document.getElementById(subTitle);
                                if (anchor) {
                                  anchor.scrollIntoView({ behavior: 'auto', block: 'start' });
                                }
                              }
                            })}
                        py={1}
                        px={2}
                        borderRadius={'md'}
                        cursor={'pointer'}
                      >
                        {subTitle}
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </BoxCard>
          <Box w={'100%'}>
            <Box>
              {/* <ImportModal value={rawData} setFormData={reset} setRawData={setRawData}>
              <Button variant={'whiteBase'} mb={3} w={'100%'} isLoading={isLoading}>
                配置文件
              </Button>
            </ImportModal> */}
            </Box>
            <Button onClick={onSubmit} w={'100%'}>
              保存
            </Button>
          </Box>
        </Flex>
      </Flex>
    </>
  );
}

export default SettingPage;
