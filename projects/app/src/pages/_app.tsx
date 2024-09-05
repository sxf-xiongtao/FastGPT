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
import '@/styles/reset.scss';
import '@/styles/default.scss';

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

function App({ Component, pageProps }: any) {
  return (
    <>
      <Head>
        <title>Admin</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ChakraProvider>
      </QueryClientProvider>
    </>
  );
}

export default appWithTranslation(App);
