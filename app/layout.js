import './globals.css';

export const metadata = {
  title: 'The B-Side Archive — Songs that remember you',
  description: 'A warm, sepia-toned internet radio for forgotten Hindi film masterpieces from the 1950s through the 1970s.',
  metadataBase: new URL('https://thebsidearchive.example'),
  openGraph: {
    title: 'The B-Side Archive',
    description: 'Songs that remember you.',
    images: ['/images/listening-room-desktop.jpg'],
  },
};

export const viewport = {
  themeColor: '#1b160f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
