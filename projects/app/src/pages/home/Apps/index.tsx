import React, { useState, useEffect } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table';
// import { useQuery } from '@tanstack/react-query';
// import { GetAppsTableData } from '@/apis/v1/tableData';
// import useDashBoardStore from '../store';
// import Pagination from '@/components/Pagination';
import { Box, HStack, Input, InputGroup, InputLeftElement } from '@chakra-ui/react';
import { EditIcon, SearchIcon } from '@chakra-ui/icons';
// import DetailModal from '../mods/DetailModal';
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
      <div className="flex">
        {/* <DetailModal data={info.row.original}> */}
        <span className="p-1 flex items-center justify-center rounded hover:bg-slate-100 cursor-pointer mr-1">
          <Icons type="detail" />
        </span>
        {/* </DetailModal> */}
        {/* <EditModal data={info.row.original}> */}
        <span className="p-1 flex items-center justify-center rounded hover:bg-slate-100 cursor-pointer">
          <EditIcon className="text-[14px]" />
        </span>
        {/* </EditModal> */}
      </div>
    )
  })
];

const defaultQueryParams = {
  _start: 0,
  _end: 10,
  _sort: 'balance',
  _order: '',
  name: ''
};

export const Apps = () => {
  const [queryParams, setQueryParams] = useState(defaultQueryParams);
  const [modelCount, setModelCount] = useState(0);

  const [data, setData] = useState(() => [...defaultData]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  } as any);

  const fetchUsers = () => {
    console.log('fetchUsers');
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="w-[90%] m-auto h-[92%]">
      <Box
        className="bg-white mt-8 w-full pl-12 py-8 h-full"
        style={{ boxShadow: '0px 2px 10px  rgba(76, 141, 235, 0.1)' }}
      >
        <HStack className="justify-between">
          <Box className="flex">
            <Box className="text-[20px] font-bold text-[#405169] mb-2">应用列表</Box>
            <Box>
              <InputGroup className="ml-4">
                <InputLeftElement className="!h-8 text-[#E5E5E5]">
                  <SearchIcon />
                </InputLeftElement>
                <Input
                  variant={'search'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setQueryParams({
                        ...queryParams,
                        name: e.currentTarget.value
                      });
                    }
                  }}
                  placeholder="输入应用名，回车搜索"
                ></Input>
              </InputGroup>
            </Box>
          </Box>
          {/* <Pagination
            values={{
              page: queryParams._start / 10 + 1,
              pageSize: 10,
              total: modelCount
            }}
            onChange={(values) => {
              setQueryParams({
                ...queryParams,
                _start: (values.page - 1) * 10,
                _end: values.page * 10
              });
            }}
            notShowSelect
          /> */}
        </HStack>
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
      </Box>
    </div>
  );
};
