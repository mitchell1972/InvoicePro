import { head, put, list } from '@vercel/blob';

export default async function handler(req, res) {
  const isVercel = !!process.env.VERCEL;
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  
  const result = {
    environment: isVercel ? 'vercel' : 'local',
    blobConfigured: hasBlobToken,
    testResults: {}
  };

  if (hasBlobToken) {
    try {
      // Test 1: List existing blobs
      const { blobs } = await list();
      result.testResults.listBlobs = {
        success: true,
        count: blobs.length,
        hasInvoicesData: blobs.some(b => b.pathname === 'invoices-data.json')
      };

      // Test 2: Try to check if invoices data exists
      try {
        const invoicesBlob = await head('invoices-data.json');
        result.testResults.invoicesData = {
          exists: true,
          size: invoicesBlob.size,
          uploadedAt: invoicesBlob.uploadedAt
        };
      } catch (e) {
        result.testResults.invoicesData = {
          exists: false,
          message: 'Invoices data will be created on first save'
        };
      }

      result.status = '✅ Blob Storage is fully configured and working!';
      result.message = 'Your invoices will now persist across deployments.';
    } catch (error) {
      result.status = '⚠️ Blob token exists but there was an error';
      result.error = error.message;
    }
  } else {
    result.status = '❌ Blob Storage not configured';
    result.message = 'BLOB_READ_WRITE_TOKEN not found. Please create a Blob store in Vercel.';
  }

  return res.status(200).json(result);
}
