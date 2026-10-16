import type { Metadata, Viewport } from 'next';
import './globals.css';
import './studio-fix.css';
export const metadata: Metadata = {
  title: 'StudyMate — Your Smart Study Partner',
  description: 'Course-connected learning for Nigerian students',
  applicationName: 'StudyMate',
  manifest: '/manifest.webmanifest',
  icons: { icon: [{ url: '/favicon.ico', sizes: 'any' }, { url: '/icon-192.png', sizes: '192x192', type: 'image/png' }], apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'StudyMate' },
};
export const viewport: Viewport = { themeColor: '#0F1F3D', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><a className="skip" href="#main">Skip to content</a>{children}</body></html>;
}
