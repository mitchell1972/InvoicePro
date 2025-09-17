export default async function handler(req, res) {
  const isVercel = !!process.env.VERCEL;
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  
  const status = {
    environment: isVercel ? 'vercel' : 'local',
    storageType: 'unknown',
    isPersistent: false,
    warning: null
  };
  
  if (isVercel && hasBlobToken) {
    status.storageType = 'vercel-blob';
    status.isPersistent = true;
  } else if (isVercel) {
    status.storageType = 'in-memory';
    status.isPersistent = false;
    status.warning = 'Storage is temporary! Invoices will be lost on cold starts. Please configure Vercel Blob Storage.';
  } else {
    status.storageType = 'file-system';
    status.isPersistent = true;
  }
  
  return res.status(200).json(status);
}
