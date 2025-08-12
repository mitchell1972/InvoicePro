// Test banking details functionality
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bankingDetails, companyDetails } = req.body;

  console.log('Banking Details Test:');
  console.log('Banking Details:', JSON.stringify(bankingDetails, null, 2));
  console.log('Company Details:', JSON.stringify(companyDetails, null, 2));

  // Test the banking section generation
  let bankingSection = '';
  if (bankingDetails && bankingDetails.country) {
    if (bankingDetails.country === 'GB' && bankingDetails.uk && bankingDetails.uk.bankName) {
      const uk = bankingDetails.uk;
      bankingSection = `
🏦 BANK TRANSFER (UK):
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bank Name: ${uk.bankName}
Account Name: ${uk.accountName}
Sort Code: ${uk.sortCode.replace(/(\d{2})(\d{2})(\d{2})/, '$1-$2-$3')}
Account Number: ${uk.accountNumber}

Please use invoice #TEST123 as your payment reference.
`;
    } else if (bankingDetails.country === 'US' && bankingDetails.us && bankingDetails.us.bankName) {
      const us = bankingDetails.us;
      bankingSection = `
🏦 BANK TRANSFER (US):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bank Name: ${us.bankName}
Account Name: ${us.accountName}
Routing Number (ABA): ${us.routingNumber}
Account Number: ${us.accountNumber}

Please use invoice #TEST123 as your payment reference.
`;
    }
  }

  return res.status(200).json({
    success: true,
    bankingDetails,
    companyDetails,
    bankingSection,
    hasBankingDetails: !!bankingSection,
    message: bankingSection ? 'Banking details found and formatted' : 'No banking details found'
  });
}
