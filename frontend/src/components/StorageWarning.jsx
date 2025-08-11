import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function StorageWarning() {
  const [storageStatus, setStorageStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check storage status
    fetch('/api/storage-status')
      .then(res => res.json())
      .then(data => {
        if (data.warning) {
          setStorageStatus(data);
        }
      })
      .catch(err => console.error('Failed to check storage status:', err));
  }, []);

  if (!storageStatus || !storageStatus.warning || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 max-w-md bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">Storage Warning</h3>
          <p className="mt-1 text-sm text-yellow-700">
            {storageStatus.warning}
          </p>
          <div className="mt-3">
            <a
              href="/BLOB_STORAGE_SETUP.md"
              target="_blank"
              className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
            >
              View Setup Instructions →
            </a>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="ml-3 flex-shrink-0 inline-flex text-yellow-400 hover:text-yellow-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
