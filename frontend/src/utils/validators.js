export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password) {
  return password && password.length >= 8;
}

export function validateInvoiceForm(data) {
  const errors = {};

  if (!data.client?.name) {
    errors.clientName = 'Client name is required';
  }

  if (!data.client?.email) {
    errors.clientEmail = 'Client email is required';
  } else if (!validateEmail(data.client.email)) {
    errors.clientEmail = 'Invalid email address';
  }

  if (!data.items || data.items.length === 0) {
    errors.items = 'At least one line item is required';
  } else {
    data.items.forEach((item, index) => {
      if (!item.description) {
        errors[`item_${index}_description`] = 'Description is required';
      }
      if (!item.qty || item.qty <= 0) {
        errors[`item_${index}_qty`] = 'Valid quantity is required';
      }
      if (!item.unitPrice || item.unitPrice <= 0) {
        errors[`item_${index}_price`] = 'Valid price is required';
      }
    });
  }

  return errors;
}


