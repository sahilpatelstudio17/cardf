// Fullname validation: only characters, no numbers, no leading spaces
export const validateFullname = (fullname) => {
  if (!fullname || !fullname.trim()) {
    return {
      isValid: false,
      message: 'Full name is required'
    }
  }

  if (/[0-9]/.test(fullname)) {
    return {
      isValid: false,
      message: 'Full name cannot contain numbers'
    }
  }

  if (fullname !== fullname.trim()) {
    return {
      isValid: false,
      message: 'Full name cannot start or end with spaces'
    }
  }

  return {
    isValid: true,
    message: ''
  }
}

// Sanitize fullname: remove numbers and leading spaces
export const sanitizeFullname = (fullname) => {
  let value = fullname
  // Remove any numbers from input
  value = value.replace(/[0-9!@#$%^&*()_+=\[\]{};:'"<>,.?/|`~\-]/g, '')
  // Remove leading spaces
  value = value.replace(/^\s+/, '')
  return value
}

// Email validation
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return {
      isValid: false,
      message: 'Email is required'
    }
  }

  const trimmedEmail = email.trim().toLowerCase()
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      message: 'Invalid email format'
    }
  }

  // Extract domain from email
  const domain = trimmedEmail.split('@')[1]
  
  // List of allowed email domains
  const allowedDomains = [
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'protonmail.com',
    'icloud.com',
    'aol.com',
    'mail.com'
  ]
  
  // Check if domain matches allowed domains
  if (!allowedDomains.includes(domain)) {
    return {
      isValid: false,
      message: ` Use your domin name :  gmail.com, yahoo.com, outlook.com, hotmail.com`
    }
  }

  return {
    isValid: true,
    message: ''
  }
}
// Password validation: min 6 chars, at least 1 uppercase, 1 lowercase, 1 number
export const validatePassword = (password) => {
  const errors = []

  if (!password) {
    return {
      isValid: false,
      message: 'Password is required'
    }
  }

  if (password.length < 6) {
    errors.push('at least 6 characters')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('at least 1 uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('at least 1 lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('at least 1 number')
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      message: `Password must have: ${errors.join(', ')}`
    }
  }

  return {
    isValid: true,
    message: ''
  }
}

// Sanitize phone number: keep only digits, +, spaces, and hyphens
export const sanitizePhoneNumber = (phone) => {
  return phone.replace(/[^0-9+\s\-]/g, '')
}

// Phone number validation (exactly 10 digits, optional +91 prefix)
export const validatePhoneNumber = (phone) => {
  if (!phone || !phone.trim()) {
    return {
      isValid: false,
      message: 'Phone number is required'
    }
  }

  let cleanPhone = phone.trim()
  
  // Check if it starts with +91
  if (cleanPhone.startsWith('+91')) {
    cleanPhone = cleanPhone.substring(3).replace(/[\s\-]/g, '')
    
    if (cleanPhone.length < 10) {
      const digitsRemaining = 10 - cleanPhone.length
      return {
        isValid: false,
        message: `Enter ${digitsRemaining} more digit${digitsRemaining > 1 ? 's' : ''} (${cleanPhone.length}/10)`
      }
    }
    
    if (!/^\d{10}$/.test(cleanPhone)) {
      return {
        isValid: false,
        message: 'Phone number must be exactly 10 digits after +91'
      }
    }
  } else {
    // Without +91, just validate 10 digits
    cleanPhone = cleanPhone.replace(/[\s\-]/g, '')
    
    if (cleanPhone.length < 10) {
      const digitsRemaining = 10 - cleanPhone.length
      return {
        isValid: false,
        message: `Enter ${digitsRemaining} more digit${digitsRemaining > 1 ? 's' : ''} (${cleanPhone.length}/10)`
      }
    }
    
    if (!/^\d{10}$/.test(cleanPhone)) {
      return {
        isValid: false,
        message: 'Phone number must be exactly 10 digits'
      }
    }
  }

  return {
    isValid: true,
    message: ''
  }
}

// Sanitize license number: keep only uppercase letters and digits
export const sanitizeLicenseNumber = (license) => {
  let value = license.toUpperCase()
  // Remove all special characters, keep only letters and numbers
  value = value.replace(/[^A-Z0-9\s\-]/g, '')
  return value
}

// License number validation (2 uppercase letters + 10 digits)
// Format: AA1234567890
export const validateLicenseNumber = (license) => {
  if (!license || !license.trim()) {
    return {
      isValid: false,
      message: 'License number is required'
    }
  }

  const cleanLicense = license.trim().toUpperCase()

  // Check format: 2 uppercase letters + 10 digits
  if (!/^[A-Z]{2}\d{10}$/.test(cleanLicense)) {
    // Provide specific feedback based on what's wrong
    if (cleanLicense.length < 12) {
      return {
        isValid: false,
        message: `License must be 12 characters (2 letters + 10 digits). You have ${cleanLicense.length}/12`
      }
    }

    if (!/^[A-Z]{2}/.test(cleanLicense)) {
      return {
        isValid: false,
        message: 'First 2 characters must be uppercase letters'
      }
    }

    if (!/\d{10}$/.test(cleanLicense)) {
      return {
        isValid: false,
        message: 'Last 10 characters must be digits'
      }
    }

    return {
      isValid: false,
      message: 'License format: 2 uppercase letters followed by 10 digits (e.g., DL1234567890)'
    }
  }

  return {
    isValid: true,
    message: ''
  }
}

// License expiry date validation (must be in the future)
export const validateLicenseExpiry = (expiryDate) => {
  if (!expiryDate) {
    return {
      isValid: false,
      message: 'License expiry date is required'
    }
  }

  const selectedDate = new Date(expiryDate)
  const today = new Date()

  // Set time to 00:00:00 for comparison
  today.setHours(0, 0, 0, 0)
  selectedDate.setHours(0, 0, 0, 0)

  if (selectedDate < today) {
    return {
      isValid: false,
      message: 'License has expired. Please use a valid license.'
    }
  }

  return {
    isValid: true,
    message: ''
  }
}
