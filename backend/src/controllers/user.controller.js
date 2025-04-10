const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Get all users (admin only)
 * @route GET /api/users
 */
const getAllUsers = async (req, res) => {
  try {
    // Check if requester is admin (would use middleware in real app)
    const requester = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (requester?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        language: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Users retrieved successfully',
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error retrieving users', error: error.message });
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Check if requester has access to this user
    // Only allow if it's the user themselves or an admin
    const requester = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (requester?.id !== userId && requester?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to access this user data' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        language: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error retrieving user', error: error.message });
  }
};

/**
 * Update user
 * @route PUT /api/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    const { firstName, lastName, phone, language, password, role } = req.body;

    // Check if requester has access to update this user
    const requester = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    // Only allow role updates for admins
    if (role && requester?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update user role' });
    }

    // Users can only update their own profiles unless they're admins
    if (requester?.id !== userId && requester?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    // Build update object
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (language) updateData.language = language;
    if (role) updateData.role = role;

    // Hash password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        language: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error updating user', error: error.message });
  }
};

/**
 * Delete user
 * @route DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Check if requester has access to delete this user
    const requester = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    // Only allow self-deletion or admin deletion
    if (requester?.id !== userId && requester?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delete this user' });
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user', error: error.message });
  }
};

/**
 * Get user's favorite properties
 * @route GET /api/users/:id/favorites
 */
const getUserFavorites = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Check if requester has access to this user's favorites
    const requester = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (requester?.id !== userId && requester?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to access this user data' });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        property: {
          include: {
            address: true,
            media: {
              where: { isMain: true },
              take: 1
            }
          }
        }
      }
    });

    res.json({
      message: 'User favorites retrieved successfully',
      favorites
    });
  } catch (error) {
    console.error('Get user favorites error:', error);
    res.status(500).json({ message: 'Server error retrieving favorites', error: error.message });
  }
};

/**
 * Get user's saved searches
 * @route GET /api/users/:id/saved-searches
 */
const getUserSavedSearches = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Check if requester has access to this user's saved searches
    const requester = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (requester?.id !== userId && requester?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to access this user data' });
    }

    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId }
    });

    res.json({
      message: 'User saved searches retrieved successfully',
      savedSearches
    });
  } catch (error) {
    console.error('Get user saved searches error:', error);
    res.status(500).json({ message: 'Server error retrieving saved searches', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserFavorites,
  getUserSavedSearches
};
