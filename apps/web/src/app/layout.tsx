import { AntdRegistry } from '@ant-design/nextjs-registry';
import '@ant-design/v5-patch-for-react-19';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '../ui/providers/ThemeProvider';
import SessionProvider from '../ui/providers/SessionProvider';
import './globals.css';


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Nexa Oper App',
  description: 'Nexa Oper App',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='pt-br'>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <SessionProvider>
          <AntdRegistry>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </AntdRegistry>
        </SessionProvider>
      </body>
    </html>
  );
}
