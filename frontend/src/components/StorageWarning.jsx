import { useState, useEffect } from 'react';

export default function StorageWarning() {
  const [storageStatus, setStorageStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/storage-status')
      .then(res => res.json())
      .then(data => {
        if (data.warning) {
          setStorageStatus(data);
        }
      })
      .catch(() => {});
  }, []);

  if (!storageStatus || !storageStatus.warning || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 max-w-md bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 z-50" role="alert">
      <div className="flex items-start">
        <svg className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">Storage Warning</h3>
          <p className="mt-1 text-sm text-yellow-700">
            {storageStatus.warning}
          </p>
          <div className="mt-3">
            <a
              href="/BLOB_STORAGE_SETUP.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
            >
              View Setup Instructions
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="ml-3 flex-shrink-0 inline-flex text-yellow-400 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded"
          aria-label="Dismiss storage warning"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
