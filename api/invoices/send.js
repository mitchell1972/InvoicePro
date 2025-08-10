// Redirect to the new comprehensive email service
export default async function handler(req, res) {
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


