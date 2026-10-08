import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Cloud Accounting System',
  description: 'Enterprise-grade Cloud Accounting, GST Billing, Delivery Challan, Inventory and Multi-Warehouse Stock Management system with Role-Based Access Control and Supabase integration.',
  openGraph: {
    title: 'Cloud Accounting System',
    description: 'Enterprise-grade Cloud Accounting, GST Billing, Delivery Challan, Inventory and Multi-Warehouse Stock Management system with Role-Based Access Control and Supabase integration.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cloud Accounting System',
    description: 'Enterprise-grade Cloud Accounting, GST Billing, Delivery Challan, Inventory and Multi-Warehouse Stock Management system with Role-Based Access Control and Supabase integration.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="h-full antialiased font-sans text-slate-900 bg-slate-50" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

