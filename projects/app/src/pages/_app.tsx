import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '@/styles/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NProgress from 'nprogress';
import Router, { useRouter } from 'next/router';
import { appWithTranslation, useTranslation } from 'next-i18next';

import '../styles/globals.scss';
import 'tailwindcss/tailwind.css';

import 'nprogress/nprogress.css';
import '@/styles/reset.scss';
import './home/Settings/index.css';
import { change2DefaultLng, serviceSideProps, setLngStore } from '@/utils/web/i18n';

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
      cacheTime: 0
    }
  }
});

function App({ Component, pageProps, oneAPIUrl }: any) {
  const router = useRouter();
  const { i18n } = useTranslation();

  useEffect(() => {
    const targetLng = change2DefaultLng(i18n.language);
    if (targetLng) {
      setLngStore(targetLng);
      router.replace(router.asPath, undefined, { locale: targetLng });
    }
  }, [i18n.language, router]);

  return (
    <>
      <Head>
        <title>Admin</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
          <Component {...pageProps} />
        </ChakraProvider>
      </QueryClientProvider>
    </>
  );
}

export default appWithTranslation(App);
