import { useState } from 'react';
import { GET } from '@/service/common/request';
import {
  Box,
  Button,
  Center,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  useDisclosure
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table';
import React from 'react';
import MyModal from '@/components/common/MyModal';

type TMember = {
  userName: string;
  role: number;
  status: number;
};

const columnHelper = createColumnHelper<TMember>();

const columns = [
  columnHelper.accessor('userName', {
    header: () => '用户名',
    cell: (info) => info.renderValue()
  }),
  columnHelper.accessor('role', {
    header: () => '权限',
    cell: (info) => info.renderValue()
  }),
  columnHelper.accessor('status', {
    header: () => '状态',
    cell: (info) => info.renderValue()
  })
];

export default function DetailTeamModal(props: { teamId: string }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { teamId } = props;
  const [data, setData] = useState([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  } as any);

  const { isLoading } = useQuery(
    ['getTeams', teamId],
    () => {
      return GET('/admin/routes/teams/getTeamMembers', { teamId });
    },
    {
      onSuccess: (res: any) => {
        setData(res.members);
      },
      enabled: isOpen
    }
  );

  return (
    <>
      <Button
        variant={'whiteBase'}
        size={'sm'}
        onClick={() => {
          onOpen();
        }}
      >
        详情
      </Button>
      <MyModal isOpen={isOpen} onClose={onClose} maxW={['90vw', '700px']} title={'团队详情'}>
        <ModalBody>
          {isLoading ? (
            <Center className="h-full">
              <Spinner />
            </Center>
          ) : (
            <>
              <table className="w-full rounded-lg mt-2">
                <thead className="text-md h-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} align="left" className="pl-2 text-[#132047] font-bold">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="text-md">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:drop-shadow-lg">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="pl-2 h-12 font-medium">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </ModalBody>
        <ModalFooter></ModalFooter>
      </MyModal>
    </>
  );
}
