import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client.js';
import { INDIAN_STATES, validateGSTIN } from '../utils/gst.js';

const EMPTY_FORM = {
  name: '',
  address: '',
  phone: '',
  email: '',
  isRegistered: true,
  gstin: '',
  stateCode: '33',
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async (q = search) => {
    setLoading(true);
    try {
      const list = await api.getCustomers(q);
      setCustomers(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditingId(c._id);
    setForm({
      name: c.name,
      address: c.address,
      phone: c.phone || '',
      email: c.email || '',
      isRegistered: c.isRegistered,
      gstin: c.gstin || '',
      stateCode: c.stateCode || '33',
    });
    setError('');
    setModalOpen(true);
  };

  const handleGstinChange = (val) => {
    const clean = val.toUpperCase();
    const next = { ...form, gstin: clean };
    if (clean.length >= 2 && INDIAN_STATES[clean.slice(0, 2)]) {
      next.stateCode = clean.slice(0, 2);
    }
    setForm(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.address.trim()) {
      setError('Customer name and address are required.');
      return;
    }
    if (form.isRegistered) {
      const check = validateGSTIN(form.gstin);
      if (!check.valid) {
        setError(check.error);
        return;
      }
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.updateCustomer(editingId, form);
      } else {
        await api.createCustomer(form);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete customer "${name}"?`)) return;
    try {
      await api.deleteCustomer(id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const gstinCheck = form.isRegistered && form.gstin ? validateGSTIN(form.gstin) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500">Manage B2B &amp; B2C buyers with GSTIN validation.</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            load(e.target.value);
          }}
          placeholder="Search by customer name, GSTIN, phone, or state..."
          className="w-full text-sm outline-none bg-transparent"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Customer Name</th>
              <th className="px-4 py-3">GSTIN / Type</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Loading customers...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-500 whitespace-pre-line">{c.address}</div>
                  </td>
                  <td className="px-4 py-3">
                    {c.isRegistered ? (
                      <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-xs font-mono font-medium text-blue-700">
                        {c.gstin}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        Unregistered (B2C)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {c.stateName} ({c.stateCode})
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    <div>{c.phone || '—'}</div>
                    <div>{c.email || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c._id, c.name)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? 'Edit Customer' : 'Add Customer'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Customer / Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. PATTAMMALMANI TRADERS"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Billing Address *
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Street, Area, City, Pincode"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isReg"
                  type="checkbox"
                  checked={form.isRegistered}
                  onChange={(e) => setForm({ ...form, isRegistered: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="isReg" className="text-sm font-medium text-slate-700">
                  GST Registered Business (B2B)
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {form.isRegistered && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      GSTIN / UIN *
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={form.gstin}
                      onChange={(e) => handleGstinChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase focus:border-blue-500 focus:outline-none"
                      placeholder="33CEEPK1872G2ZN"
                    />
                    {gstinCheck && (
                      <div
                        className={`mt-1 flex items-center gap-1 text-[11px] ${
                          gstinCheck.valid ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {gstinCheck.valid ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Valid ({gstinCheck.stateName})
                          </>
                        ) : (
                          gstinCheck.error
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">State *</label>
                  <select
                    value={form.stateCode}
                    disabled={form.isRegistered && gstinCheck?.valid}
                    onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
                  >
                    {Object.entries(INDIAN_STATES).map(([code, name]) => (
                      <option key={code} value={code}>
                        {code} - {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

