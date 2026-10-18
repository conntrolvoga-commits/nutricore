import type { Metadata } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SideCart from '@/components/SideCart';
import { SITE_URL } from '@/lib/format';

const display = Fredoka({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Nunito({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Mossaica | Fichas de lotería y miniaturas mexicanas', template: '%s | Mossaica' },
  description: 'Fichas de lotería coleccionables, miniaturas y artículos temáticos mexicanos y pop. Envíos a todo México.',
  openGraph: { type: 'website', locale: 'es_MX', siteName: 'Mossaica' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${display.variable} ${body.variable}`}>
      <body>
        <Header />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
        <SideCart />
      </body>
    </html>
  );
}
