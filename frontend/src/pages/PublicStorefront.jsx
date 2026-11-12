import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import StorefrontRenderer from '../components/StorefrontRenderer.jsx';

export default function PublicStorefront() {
  const [searchParams] = useSearchParams();
  const isDraft = searchParams.get('preview') === 'draft';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getStorefrontPublic(isDraft)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isDraft]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading storefront...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-rose-600">
        {error || 'Storefront unavailable.'}
      </div>
    );
  }

  return (
    <div>
      {isDraft && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between">
          <span>PREVIEW MODE — Viewing unpublished draft changes.</span>
          <Link to="/cms" className="underline font-bold">
            Back to CMS Builder
          </Link>
        </div>
      )}
      <StorefrontRenderer config={data.config} products={data.products} />
    </div>
  );
}

