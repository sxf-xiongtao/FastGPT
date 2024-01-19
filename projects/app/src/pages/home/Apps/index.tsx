import React, { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table';
import { Box, Center, HStack, Spinner } from '@chakra-ui/react';
import { GET } from '@/service/common/request';
import { useQuery } from '@tanstack/react-query';
import DetailModal from '../components/DetailModal';
import Pagination from '@/components/Pagination';
import Icons from '@/components/Icons';

type APP = {
  id: string;
  name: string;
  intro: string;
  'share.collection': string;
  operation?: any;
};

const columnHelper = createColumnHelper<APP>();

const defaultData: APP[] = [
  {
    id: 'string',
    name: 'string',
    intro: 'string',
    'share.collection': 'string'
  }
];

const columns = [
  columnHelper.accessor('id', {
    header: () => 'id',
    cell: (info) => info.getValue()
  }),
  columnHelper.accessor('name', {
    header: () => '应用名',
    cell: (info) => info.renderValue()
  }),
  columnHelper.accessor('share.collection', {
    header: () => '收藏数',
    cell: (info) => (
      <div className="w-[60px] text-center">{info.row.original['share.collection']}</div>
    )
  }),
  columnHelper.accessor('intro', {
    header: () => '介绍',
    cell: (info) => info.renderValue()
  }),
  columnHelper.accessor('operation', {
    header: () => '操作',
    cell: (info) => (
      <div className="flex w-[80px] pl-2">
        <DetailModal data={info.row.original} />
      </div>
    )
  })
];

const defaultQueryParams = {
  _start: 0,
  _end: 20,
  name: ''
};

export default function Apps() {
  const [queryParams, setQueryParams] = useState(defaultQueryParams);
  const [total, setTotal] = useState(0);

  const [data, setData] = useState(() => [...defaultData]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  } as any);

  const { isLoading } = useQuery(
    ['getUsers', queryParams],
    () => {
      return GET('/admin/routes/apps/getApps', queryParams);
    },
    {
      onSuccess: (res: any) => {
        setData(res.models);
        setTotal(res.total);
      }
    }
  );

  return (
    <div className="w-[90%] m-auto h-[95%] pb-8">
      <Box
        className="bg-white mt-8 w-full pl-12 pb-4 pt-6 h-full flex flex-col"
        style={{ boxShadow: '0px 2px 10px  rgba(76, 141, 235, 0.1)' }}
      >
        <HStack className="justify-between h-12 pr-4">
          <Box className="flex">
            <Box className="text-[20px] font-bold text-[#405169] mb-2">应用列表</Box>
          </Box>
          <Box className="!h-8 -mt-2">
            <Pagination
              values={{
                page: queryParams._start / 20 + 1,
                pageSize: 20,
                total: total
              }}
              onChange={(values) => {
                setQueryParams({
                  ...queryParams,
                  _start: (values.page - 1) * 20,
                  _end: values.page * 20
                });
              }}
              notShowSelect
            />
          </Box>
        </HStack>
        <Box className="overflow-auto h-full flex-1 pr-4">
          {isLoading ? (
            <Center className="h-full">
              <Spinner />
            </Center>
          ) : data.length === 0 ? (
            <Center className="h-[400px]">
              <Box className="flex flex-col">
                <Icons type="empty" />
                <span className="w-full text-center mt-4 text-[#c5cae9]">暂无数据</span>
              </Box>
            </Center>
          ) : (
            <table className="w-full rounded-lg mt-2">
              <thead className="text-xl h-10">
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
              <tbody className="text-lg">
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
          )}
        </Box>
      </Box>
    </div>
  );
}
