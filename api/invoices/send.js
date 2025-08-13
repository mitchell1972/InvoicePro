// Redirect to the new comprehensive email service
export default async function handler(req, res) {
  // Debug logging to check what's being received
  console.log('[SEND.JS] Request body received:', JSON.stringify(req.body, null, 2));
  console.log('[SEND.JS] Banking details:', JSON.stringify(req.body.bankingDetails, null, 2));
  
  // Forward the request to the email service with proper action
  const emailServiceRequest = {
    ...req,
    body: {
      action: 'send_invoice',
      ...req.body
    }
  };

  // Import and call the email service
  const { default: emailService } = await import('./email-service.js');
  return await emailService(emailServiceRequest, res);
}
