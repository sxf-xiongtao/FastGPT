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
import { useQuery } from '@tanstack/react-query';
import Pagination from '@/components/Pagination';
import DetailTeamModal from './mods/DetailTeamModal';
import EditTeamModal from './mods/EditTeamModal';
import Icons from '@/components/Icons';

type APP = {
  id: string;
  ownerId: string;
  name: string;
  balance: number;
  maxSize: number;
  createTime: string;
  operation?: any;
};

const columnHelper = createColumnHelper<APP>();

const columns = [
  columnHelper.accessor('id', {
    header: () => 'id',
    cell: (info) => info.getValue()
  }),
  columnHelper.accessor('ownerId', {
    header: () => 'ownerId',
    cell: (info) => info.getValue()
  }),
  columnHelper.accessor('name', {
    header: () => '团队名',
    cell: (info) => info.renderValue()
  }),
  columnHelper.accessor('balance', {
    header: () => '余额',
    cell: (info) => info.renderValue()
  }),
  columnHelper.accessor('maxSize', {
    header: () => '团队最大成员数',
    cell: (info) => <div className="w-32 text-center">{info.renderValue()}</div>
  }),
  columnHelper.accessor('createTime', {
    header: () => '创建时间',
    cell: (info) => info.renderValue()
  }),
  columnHelper.accessor('operation', {
    header: () => '操作',
    cell: (info) => (
      <div className="flex">
        <DetailTeamModal teamId={info.row.original.id} />
        <EditTeamModal data={info.row.original} />
      </div>
    )
  })
];

const defaultQueryParams = {
  _start: 0,
  _end: 20,
  id: ''
};

export default function Teams() {
  const [queryParams, setQueryParams] = useState(defaultQueryParams);
  const [total, setTotal] = useState(0);

  const [data, setData] = useState([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  } as any);

  const { isLoading } = useQuery(
    ['getTeams', queryParams],
    () => {
      return GET('/admin/routes/teams/getTeams', queryParams);
    },
    {
      onSuccess: (res: any) => {
        setData(res.teams);
        setTotal(res.total);
      },
      onError: (err) => {
        console.log(err);
        setData([]);
        setTotal(0);
      }
    }
  );

  return (
    <div className="w-[90%] m-auto h-[95%] pb-8">
      <Box
        className="bg-white mt-8 w-full pl-12 pr-4 pb-4 pt-6 h-full overflow-auto"
        style={{ boxShadow: '0px 2px 10px  rgba(76, 141, 235, 0.1)' }}
      >
        <HStack className="justify-between">
          <Box className="flex">
            <Box className="text-[20px] font-bold text-[#405169] mb-2">团队列表</Box>
            <Box className="mt-[2px]">
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
                        id: e.currentTarget.value
                      });
                    }
                  }}
                  className="!w-60"
                  placeholder="输入 id 或 ownerId，回车搜索"
                ></Input>
              </InputGroup>
            </Box>
          </Box>
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
        </HStack>
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
    </div>
  );
}
