import { Image } from '@chakra-ui/react';
import { useRouter } from 'next/router';

export default function HeadBar() {
  const router = useRouter();

  return (
    <div
      className="flex h-[60px] justify-between px-10 py-4 absolute w-full"
      style={{ boxShadow: '0px 2px 10px  rgba(76, 141, 235, 0.1)' }}
    >
      <div className="flex items-center text-xl font-semibold">Admin</div>
    </div>
  );
}
