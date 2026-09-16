import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reef Health Map',
  description:
    'Scientific benthic survey and archival specimen health mapping interface with ResNet50 classification diagnostics.',
  openGraph: {
    title: 'Reef Health Map',
    description:
      'Scientific benthic survey and archival specimen health mapping interface with ResNet50 classification diagnostics.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#E7E2D4] text-[#1D1C13] antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}