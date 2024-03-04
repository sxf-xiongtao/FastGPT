import ReactMarkdown from 'react-markdown';
import MDImage from './MDImage';
import React, { useMemo } from 'react';
import RemarkGfm from 'remark-gfm';
import RemarkMath from 'remark-math';
import RehypeKatex from 'rehype-katex';
import RemarkBreaks from 'remark-breaks';
import { useDisclosure, ModalBody, ModalFooter } from '@chakra-ui/react';

import styles from './index.module.scss';
import MyModal from '@/components/common/MyModal';

function Image({ src }: { src?: string }) {
  return <MDImage src={src} />;
}

const Markdown = ({ source }: { source: string }) => {
  const components = useMemo(
    () => ({
      img: Image,
      pre: 'div',
      p: 'div'
    }),
    []
  );

  const formatSource = source
    .replace(/\\n/g, '\n&nbsp;')
    .replace(/(http[s]?:\/\/[^\s，。]+)([。，])/g, '$1 $2');

  return (
    <ReactMarkdown
      className={`markdown ${styles.markdown} text-lg`}
      remarkPlugins={[RemarkGfm, RemarkMath, RemarkBreaks]}
      rehypePlugins={[RehypeKatex]}
      // @ts-ignore
      components={components}
    >
      {formatSource}
    </ReactMarkdown>
  );
};

export default function MarkdownModal(props: { children: React.ReactElement; source: string }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { children, source } = props;

  return (
    <>
      {children &&
        React.cloneElement(children, {
          onClick: (e: any) => {
            e.stopPropagation();
            onOpen();
          }
        })}

      <MyModal isOpen={isOpen} onClose={onClose} title={'配置介绍'}>
        <ModalBody>
          <Markdown source={source} />
        </ModalBody>
        <ModalFooter></ModalFooter>
      </MyModal>
    </>
  );
}
