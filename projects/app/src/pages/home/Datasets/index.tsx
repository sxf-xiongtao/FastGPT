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
import Pagination from '@/components/Pagination';
import { useQuery } from '@tanstack/react-query';

type User = {
  id: string;
  userId: number;
  name: string;
  tags: Array<string>;
  createTime: string;
  operation?: any;
};

const columnHelper = createColumnHelper<User>();

const columns = [
  columnHelper.accessor('id', {
    header: () => 'id',
    cell: (info) => info.getValue()
  }),
  columnHelper.accessor('userId', {
    header: () => 'userId',
    cell: (info) => info.renderValue()
  }),
  columnHelper.accessor('name', {
    header: () => '知识库名',
    cell: (info) => info.renderValue()
  }),
  columnHelper.accessor('tags', {
    header: () => '标签',
    cell: (info) => info.renderValue()
  })
  // columnHelper.accessor('operation', {
  //   header: () => '操作',
  //   cell: (info) => (
  //     <div className="flex">
  //       <DetailModal data={info.row.original}>
  //         <span className="p-1 flex items-center justify-center rounded hover:bg-slate-100 cursor-pointer mr-1">
  //           <Icons type="detail" />
  //         </span>
  //       </DetailModal>
  //     </div>
  //   )
  // })
];

const defaultQueryParams = {
  _start: 0,
  _end: 20,
  _sort: 'balance',
  _order: '',
  name: ''
};

export default function Datasets() {
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
      return GET('/admin/routes/datasets/getDatasets', queryParams);
    },
    {
      onSuccess: (res: any) => {
        console.log(res);
        setData(res.datasets);
        setTotal(res.total);
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
          <Box className="flex flex-1">
            <Box className="text-[20px] font-bold text-[#405169]">知识库列表</Box>
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
                        name: e.currentTarget.value
                      });
                    }
                  }}
                  placeholder="输入知识库名，回车搜索"
                ></Input>
              </InputGroup>
            </Box>
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
        {isLoading ? (
          <Center className="h-full">
            <Spinner />
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
    </div>
  );
}
