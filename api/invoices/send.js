export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { invoiceId, recipientEmail } = req.body || {};

  if (!invoiceId || !recipientEmail) {
    return res
      .status(400)
      .json({ error: 'Invoice ID and recipient email are required' });
  }

  // Simulate email sending
  console.log(`[EMAIL] Sending invoice ${invoiceId} to ${recipientEmail}`);

  setTimeout(() => {
    console.log(`[EMAIL] Invoice ${invoiceId} sent successfully`);
  }, 1000);

  return res.status(200).json({
    success: true,
    message: `Invoice sent to ${recipientEmail}`,
    sentAt: new Date().toISOString(),
    paymentLink: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/pay/${invoiceId}`
  });
}


