const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
};

const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return {
      isValid: false,
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    };
  }

  return { isValid: true };
};

const normalizeEmail = (email) => {
  return email ? email.trim().toLowerCase() : '';
};

const validateRegisterInput = (data = {}) => {
  const { name, firstName, lastName, email, password } = data;
  const errors = [];

  let fName = firstName ? firstName.trim() : '';
  let lName = lastName ? lastName.trim() : '';

  if (!fName && name) {
    const parts = name.trim().split(' ');
    fName = parts[0] || '';
    lName = parts.slice(1).join(' ') || parts[0] || '';
  }

  if (!fName) errors.push('First name or full name is required');
  if (!lName) errors.push('Last name is required');
  if (!validateEmail(email)) errors.push('Valid email address is required');

  const passCheck = validatePasswordStrength(password);
  if (!passCheck.isValid) errors.push(passCheck.message);

  return {
    isValid: errors.length === 0,
    errors,
    firstName: fName,
    lastName: lName,
  };
};

const validateLoginInput = ({ email, password }) => {
  const errors = [];
  if (!validateEmail(email)) errors.push('Valid email address is required');
  if (!password) errors.push('Password is required');

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateEmail,
  validatePasswordStrength,
  normalizeEmail,
  validateRegisterInput,
  validateLoginInput,
};

