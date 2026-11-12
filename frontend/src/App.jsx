import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Invoices from './pages/Invoices.jsx';
import InvoiceForm from './pages/InvoiceForm.jsx';
import InvoiceDetail from './pages/InvoiceDetail.jsx';
import Products from './pages/Products.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import StorefrontCMS from './pages/StorefrontCMS.jsx';
import PublicStorefront from './pages/PublicStorefront.jsx';
import Bookings from './pages/Bookings.jsx';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/store" element={<PublicStorefront />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<InvoiceForm />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
          <Route path="/products" element={<Products />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/cms" element={<StorefrontCMS />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

