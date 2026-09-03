import './globals.css';

export const metadata = {
  title: 'Trung Hoa',
  description: 'Nền tảng học tiếng Trung cho người Việt.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
