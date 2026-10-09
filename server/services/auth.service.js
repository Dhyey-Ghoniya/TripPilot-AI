const User = require('../models/User');
const {
  validateRegisterInput,
  validateLoginInput,
  validatePasswordStrength,
  normalizeEmail,
} = require('../utils/validation');
const { generateToken } = require('../utils/jwt');

class AuthService {
  async register(userData) {
    const { name, firstName, lastName, email, password, phone, avatar, profileImage, travelPreferences } = userData;

    // Validate registration fields
    const validation = validateRegisterInput({ name, firstName, lastName, email, password });
    if (!validation.isValid) {
      const error = new Error(validation.errors.join('. '));
      error.statusCode = 400;
      error.errors = validation.errors;
      throw error;
    }

    const cleanEmail = normalizeEmail(email);

    // Check for duplicate account
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      const error = new Error('An account with this email address already exists');
      error.statusCode = 409;
      throw error;
    }

    // Force role to USER for public registration (security: never allow self-register as ADMIN)
    const user = new User({
      firstName: validation.firstName,
      lastName: validation.lastName,
      name: name ? name.trim() : `${validation.firstName} ${validation.lastName}`,
      email: cleanEmail,
      password,
      avatar: avatar || profileImage || '',
      profileImage: profileImage || avatar || '',
      phone: phone ? phone.trim() : '',
      role: 'USER',
      isActive: true,
      isEmailVerified: false,
      travelPreferences: travelPreferences || {},
    });

    await user.save();

    // Generate JWT token
    const token = generateToken({ userId: user._id, role: user.role });

    return {
      user: user.toSafeObject(),
      token,
    };
  }

  async login({ email, password }) {
    // Validate login inputs
    const validation = validateLoginInput({ email, password });
    if (!validation.isValid) {
      const error = new Error(validation.errors.join('. '));
      error.statusCode = 400;
      throw error;
    }

    const cleanEmail = normalizeEmail(email);

    // Find user with password selected
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Check account active status
    if (!user.isActive) {
      const error = new Error('Your account is currently inactive. Please contact support.');
      error.statusCode = 401;
      throw error;
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Generate JWT token
    const token = generateToken({ userId: user._id, role: user.role });

    return {
      user: user.toSafeObject(),
      token,
    };
  }

  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    if (!user.isActive) {
      const error = new Error('User account is inactive');
      error.statusCode = 401;
      throw error;
    }
    return user.toSafeObject();
  }

  async updateProfile(userId, updateData) {
    const allowedFields = ['name', 'firstName', 'lastName', 'phone', 'avatar', 'profileImage', 'dateOfBirth', 'travelPreferences'];
    const filteredUpdate = {};

    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredUpdate[key] = updateData[key];
      }
    });

    // Sanitize fields
    if (filteredUpdate.name) filteredUpdate.name = filteredUpdate.name.trim();
    if (filteredUpdate.firstName) filteredUpdate.firstName = filteredUpdate.firstName.trim();
    if (filteredUpdate.lastName) filteredUpdate.lastName = filteredUpdate.lastName.trim();

    if (filteredUpdate.avatar && !filteredUpdate.profileImage) {
      filteredUpdate.profileImage = filteredUpdate.avatar;
    } else if (filteredUpdate.profileImage && !filteredUpdate.avatar) {
      filteredUpdate.avatar = filteredUpdate.profileImage;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: filteredUpdate },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return updatedUser.toSafeObject();
  }

  async changePassword(userId, currentPassword, newPassword, confirmPassword) {
    if (!currentPassword || !newPassword || !confirmPassword) {
      const error = new Error('Current password, new password, and confirm password are required');
      error.statusCode = 400;
      throw error;
    }

    if (newPassword !== confirmPassword) {
      const error = new Error('New password and confirm password do not match');
      error.statusCode = 400;
      throw error;
    }

    const passCheck = validatePasswordStrength(newPassword);
    if (!passCheck.isValid) {
      const error = new Error(passCheck.message);
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      const error = new Error('Incorrect current password');
      error.statusCode = 400;
      throw error;
    }

    // Set new password (will be hashed in pre-save hook)
    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }
}

module.exports = new AuthService();

