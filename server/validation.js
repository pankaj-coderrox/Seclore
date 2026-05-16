const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateLead(body, type) {
  const lead = {
    type,
    name: asString(body.name),
    email: asString(body.email).toLowerCase(),
    company: asString(body.company),
    phone: asString(body.phone),
    role: asString(body.role),
    interest: asString(body.interest),
    message: asString(body.message),
    source: asString(body.source) || "website",
    metadata: {
      country: asString(body.country)
    }
  };

  const errors = {};
  const phonePattern = /^[+()\d\s.-]{7,30}$/;

  if (!lead.name || lead.name.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  if (!emailPattern.test(lead.email)) {
    errors.email = "A valid email address is required.";
  }

  if (type === "demo" && !lead.company) {
    errors.company = "Company is required for demo requests.";
  }

  if (type === "demo" && lead.source === "demo-page") {
    if (!lead.role) {
      errors.role = "Job title is required.";
    }

    if (!lead.phone) {
      errors.phone = "Phone number is required.";
    }

    if (!lead.metadata.country) {
      errors.country = "Country is required.";
    }
  }

  if (lead.phone && !phonePattern.test(lead.phone)) {
    errors.phone = "Enter a valid phone number.";
  }

  if (type === "contact" && !lead.message) {
    errors.message = "Message is required.";
  }

  if (lead.message.length > 1500) {
    errors.message = "Message must be 1500 characters or fewer.";
  }

  return {
    lead,
    errors,
    valid: Object.keys(errors).length === 0
  };
}

export function validatePartnerRegistration(body) {
  const firstName = asString(body.firstName);
  const lastName = asString(body.lastName);
  const lead = {
    type: "partner",
    name: `${firstName} ${lastName}`.trim(),
    email: asString(body.email).toLowerCase(),
    company: asString(body.company),
    phone: asString(body.phone),
    role: asString(body.jobTitle),
    interest: asString(body.requestType) || "Become a Partner",
    message: "Partner portal access request",
    source: "partner-register",
    metadata: {
      requestType: asString(body.requestType),
      partnerType: asString(body.partnerType),
      country: asString(body.country),
      website: asString(body.website),
      employees: asString(body.employees),
      firstName,
      lastName
    }
  };

  const errors = {};

  if (!lead.interest) {
    errors.requestType = "Request type is required.";
  }

  if (!lead.metadata.partnerType) {
    errors.partnerType = "Type of partner is required.";
  }

  if (!lead.company) {
    errors.company = "Company name is required.";
  }

  if (!lead.metadata.country) {
    errors.country = "Country is required.";
  }

  if (!lead.metadata.website) {
    errors.website = "Company website is required.";
  }

  if (!lead.metadata.employees) {
    errors.employees = "Number of employees is required.";
  }

  if (!emailPattern.test(lead.email)) {
    errors.email = "A valid email address is required.";
  }

  if (!firstName || firstName.length < 2) {
    errors.firstName = "First name must be at least 2 characters.";
  }

  if (!lastName || lastName.length < 2) {
    errors.lastName = "Last name must be at least 2 characters.";
  }

  if (!lead.phone) {
    errors.phone = "Phone number is required.";
  }

  if (!lead.role) {
    errors.jobTitle = "Job title is required.";
  }

  return {
    lead,
    errors,
    valid: Object.keys(errors).length === 0
  };
}

export function validateDealRegistration(body) {
  const firstName = asString(body.firstName);
  const lastName = asString(body.lastName);
  const lead = {
    type: "deal",
    name: `${firstName} ${lastName}`.trim(),
    email: asString(body.email).toLowerCase(),
    company: asString(body.partnerCompany),
    phone: asString(body.phone),
    role: asString(body.jobTitle),
    interest: asString(body.dealName) || "Register a Deal",
    message: asString(body.notes),
    source: "register-deal",
    metadata: {
      firstName,
      lastName,
      partnerCompany: asString(body.partnerCompany),
      customerCompany: asString(body.customerCompany),
      customerContact: asString(body.customerContact),
      customerEmail: asString(body.customerEmail).toLowerCase(),
      country: asString(body.country),
      estimatedValue: asString(body.estimatedValue),
      closeDate: asString(body.closeDate),
      productInterest: asString(body.productInterest)
    }
  };

  const errors = {};

  if (!firstName || firstName.length < 2) {
    errors.firstName = "First name must be at least 2 characters.";
  }

  if (!lastName || lastName.length < 2) {
    errors.lastName = "Last name must be at least 2 characters.";
  }

  if (!emailPattern.test(lead.email)) {
    errors.email = "A valid partner email is required.";
  }

  if (!lead.company) {
    errors.partnerCompany = "Partner company is required.";
  }

  if (!lead.phone) {
    errors.phone = "Phone number is required.";
  }

  if (!lead.role) {
    errors.jobTitle = "Job title is required.";
  }

  if (!lead.interest) {
    errors.dealName = "Deal name is required.";
  }

  if (!lead.metadata.customerCompany) {
    errors.customerCompany = "Customer company is required.";
  }

  if (!lead.metadata.customerContact) {
    errors.customerContact = "Customer contact is required.";
  }

  if (!emailPattern.test(lead.metadata.customerEmail)) {
    errors.customerEmail = "A valid customer email is required.";
  }

  if (!lead.metadata.country) {
    errors.country = "Country is required.";
  }

  if (!lead.metadata.estimatedValue) {
    errors.estimatedValue = "Estimated value is required.";
  }

  if (!lead.metadata.closeDate) {
    errors.closeDate = "Expected close date is required.";
  }

  return {
    lead,
    errors,
    valid: Object.keys(errors).length === 0
  };
}
