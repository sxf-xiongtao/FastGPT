import React, { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table';
import {
  Box,
  Center,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { GET } from '@/service/common/request';
import UserEditModal from './mods/UserEditModal';
import Pagination from '@/components/Pagination';
import { useQuery } from '@tanstack/react-query';
import UserDetailModal from './mods/UserDetailModal';
import UserAddModal from './mods/UserAddModal';
import Icons from '@/components/Icons';

type User = {
  userId: string;
  username: string;
  createTime: string;
  status: string;
  operation?: any;
};

const columnHelper = createColumnHelper<User>();

const columns = [
  columnHelper.accessor('userId', {
    header: () => 'id',
    cell: (info) => info.getValue()
  }),
  columnHelper.accessor('username', {
    header: () => '用户名',
    cell: (info) => info.renderValue()
  }),
  columnHelper.accessor('createTime', {
    header: () => '创建时间',
    cell: (info) => info.renderValue()
  }),
  columnHelper.accessor('status', {
    header: () => '状态',
    cell: (info) => info.renderValue()
  }),
  columnHelper.accessor('operation', {
    header: () => '操作',
    cell: (info) => (
      <div className="flex">
        <UserDetailModal data={info.row.original} />
        <UserEditModal data={info.row.original} />
      </div>
    )
  })
];

const defaultQueryParams = {
  _start: 0,
  _end: 20,
  _sort: 'balance',
  _order: '',
  search: ''
};

export default function Users() {
  const [queryParams, setQueryParams] = useState(defaultQueryParams);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  } as any);

  const { isLoading } = useQuery(
    ['getUsers', queryParams],
    () => {
      return GET('/admin/routes/users/getUsers', queryParams);
    },
    {
      onSuccess: (res: any) => {
        setData(res.users);
        setTotal(res.total);
      },
      onError: () => {
        setData([]);
        setTotal(0);
      }
    }
  );

  return (
    <div className="w-[90%] m-auto h-[95%] pb-8">
      <Box
        className="bg-white mt-8 w-full pl-12 pb-4 pt-6 h-full flex flex-col"
        style={{ boxShadow: '0px 2px 10px rgba(76, 141, 235, 0.1)' }}
      >
        <HStack className="justify-between h-16 pr-4">
          <Box className="flex flex-1">
            <Box className="text-[20px] font-bold text-[#405169] mb-2">用户列表</Box>
            <Box className="mt-[2px]">
              <InputGroup className="ml-4">
                <InputLeftElement className="!h-8 text-[#E5E5E5]">
                  <SearchIcon />
                </InputLeftElement>
                <Input
                  variant={'search'}
                  className="!w-[240px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setQueryParams({
                        ...queryParams,
                        search: e.currentTarget.value
                      });
                    }
                  }}
                  placeholder="输入用户 id 或用户名，回车搜索"
                ></Input>
              </InputGroup>
            </Box>
            <UserAddModal data={{}} />
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
            <table className="w-full rounded-lg">
              <thead className="text-lg h-10">
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
          )}
        </Box>
      </Box>
    </div>
  );
}
