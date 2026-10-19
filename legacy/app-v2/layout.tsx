import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Coral Reef Bleaching Classifier',
  description: 'Upload coral quadrat photos, classify bleaching with YOLOv8 + ResNet50, and explore results on an interactive map of the Philippines.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="text-[#1f2430] antialiased">{children}</body>
    </html>
  );
}
