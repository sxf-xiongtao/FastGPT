import Head from 'next/head';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NProgress from 'nprogress';
import Router from 'next/router';

import { appWithTranslation } from 'next-i18next';

import { theme } from '@fastgpt/web/styles/theme';
import Layout from '@/components/Layout';

import '../styles/globals.scss';
import 'tailwindcss/tailwind.css';

import 'nprogress/nprogress.css';
import '../styles/reset.scss';
import SystemStoreContextProvider from '@fastgpt/web/context/useSystem';
import type { AppProps } from 'next/app';
import type { NextPage } from 'next';
import type { ReactElement } from 'react';

//Binding events.
Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      cacheTime: 0,
      networkMode: 'always'
    }
  }
});

type NextPageWithLayout = NextPage & {
  setLayout?: (page: ReactElement) => JSX.Element;
};
type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function App({ Component, pageProps }: AppPropsWithLayout) {
  const setLayout = Component.setLayout || ((page) => <>{page}</>);

  return (
    <>
      <Head>
        <title>Admin</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <QueryClientProvider client={queryClient}>
        <SystemStoreContextProvider device={pageProps.deviceSize}>
          <ChakraProvider theme={theme}>
            <Layout>{setLayout(<Component {...pageProps} />)}</Layout>
          </ChakraProvider>
        </SystemStoreContextProvider>
      </QueryClientProvider>
    </>
  );
}

export default appWithTranslation(App);
