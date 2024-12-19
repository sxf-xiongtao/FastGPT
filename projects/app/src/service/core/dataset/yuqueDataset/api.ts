import type { APIFileItem, YuqueServer } from '@fastgpt/global/core/dataset/apiDataset';
import axios, { Method } from 'axios';
import { ParentIdType } from '@fastgpt/global/common/parentFolder/type';
import { addLog } from '@fastgpt/service/common/system/log';

type ResponseDataType = {
  success: boolean;
  message: string;
  data: any;
};

type yuqueRepoListResponse = {
  id: string;
  name: string;
  title: string;
  book_id: string | null;
  type: string;
  updated_at: Date;
  created_at: Date;
}[];

type yuqueTocListResponse = {
  uuid: string;
  type: string;
  title: string;
  url: string;
  slug: string;
  id: string;
  doc_id: string;
  prev_uuid: string;
  sibling_uuid: string;
  child_uuid: string;
  parent_uuid: string;
}[];

const yuqueBaseUrl = process.env.YUQUE_DATASET_BASE_URL || 'https://www.yuque.com';

export const useYuqueDatasetRequest = ({ yuqueServer }: { yuqueServer: YuqueServer }) => {
  const instance = axios.create({
    baseURL: yuqueBaseUrl,
    timeout: 60000, // 超时时间
    headers: {
      'X-Auth-Token': yuqueServer.token
    }
  });

  /**
   * 响应数据检查
   */
  const checkRes = (data: ResponseDataType) => {
    if (data === undefined) {
      addLog.info('yuque dataset data is empty');
      return Promise.reject('服务器异常');
    }
    return data.data;
  };
  const responseError = (err: any) => {
    console.log('error->', '请求错误', err);

    if (!err) {
      return Promise.reject({ message: '未知错误' });
    }
    if (typeof err === 'string') {
      return Promise.reject({ message: err });
    }
    if (typeof err.message === 'string') {
      return Promise.reject({ message: err.message });
    }
    if (typeof err.data === 'string') {
      return Promise.reject({ message: err.data });
    }
    if (err?.response?.data) {
      return Promise.reject(err?.response?.data);
    }
    return Promise.reject(err);
  };

  const request = <T>(url: string, data: any, method: Method): Promise<T> => {
    /* 去空 */
    for (const key in data) {
      if (data[key] === undefined) {
        delete data[key];
      }
    }

    return instance
      .request({
        url,
        method,
        data: ['POST', 'PUT'].includes(method) ? data : undefined,
        params: !['POST', 'PUT'].includes(method) ? data : undefined
      })
      .then((res) => checkRes(res.data))
      .catch((err) => responseError(err));
  };

  const listFiles = async ({ parentId }: { parentId?: ParentIdType }) => {
    let files: APIFileItem[] = [];

    if (!parentId) {
      const data = await request<yuqueRepoListResponse>(
        `/api/v2/groups/${yuqueServer.userId}/repos`,
        {},
        'GET'
      );

      files = data.map((item) => {
        return {
          id: item.id,
          name: item.name,
          parentId: null,
          type: 'folder',
          updateTime: item.updated_at,
          createTime: item.created_at
        };
      });
    } else {
      let offset = 0;
      if (typeof parentId === 'number') {
        const data = await request<yuqueTocListResponse>(
          `/api/v2/repos/${parentId}/toc`,
          {
            offset,
            limit: 100
          },
          'GET'
        );

        return data
          .filter((item) => !item.parent_uuid)
          .map((item) => ({
            id: `${parentId}-${item.id}-${item.uuid}`,
            name: item.title,
            parentId: item.parent_uuid,
            type: item.type === 'TITLE' ? ('folder' as const) : ('file' as const),
            updateTime: new Date(),
            createTime: new Date()
          }));
      } else {
        const [repoId, uuid, parentUuid] = parentId.split('-');
        const data = await request<yuqueTocListResponse>(
          `/api/v2/repos/${repoId}/toc`,
          {
            offset,
            limit: 100
          },
          'GET'
        );

        return data
          .filter((item) => item.parent_uuid === parentUuid)
          .map((item) => ({
            id: `${repoId}-${item.id}-${item.uuid}`,
            name: item.title,
            parentId: item.parent_uuid,
            type: item.type === 'TITLE' ? ('folder' as const) : ('file' as const),
            updateTime: new Date(),
            createTime: new Date()
          }));
      }
    }

    if (!Array.isArray(files)) {
      return Promise.reject('Invalid file list format');
    }
    if (files.some((file) => !file.id || !file.name || typeof file.type === 'undefined')) {
      return Promise.reject('Invalid file data format');
    }
    return files;
  };

  const getFileContent = async ({ apiFileId }: { apiFileId: string }) => {
    const [parentId, fileId] = apiFileId.split('-');

    const data = await request<{ body: string }>(
      `/api/v2/repos/${parentId}/docs/${fileId}`,
      {},
      'GET'
    );

    return data.body;
  };

  const getFilePreviewUrl = async ({ apiFileId }: { apiFileId: string }) => {
    const [parentId, fileId] = apiFileId.split('-');

    const { slug: parentSlug } = await request<{ slug: string }>(
      `/api/v2/repos/${parentId}`,
      { id: apiFileId },
      'GET'
    );

    const { slug: fileSlug } = await request<{ slug: string }>(
      `/api/v2/repos/${parentId}/docs/${fileId}`,
      {},
      'GET'
    );

    return `${yuqueBaseUrl}/${yuqueServer.userId}/${parentSlug}/${fileSlug}`;
  };

  return {
    getFileContent,
    listFiles,
    getFilePreviewUrl
  };
};
