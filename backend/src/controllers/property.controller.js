const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Get all properties with filtering
 * @route GET /api/properties
 */
const getProperties = async (req, res) => {
  try {
    const {
      type,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      city,
      state,
      status = 'ACTIVE',
      verified,
      limit = 10,
      page = 1
    } = req.query;

    // Build filter object
    const where = {};
    
    // Only show active properties by default
    where.status = status;
    
    // Add filters if provided
    if (type) where.type = type;
    if (minPrice) where.price = { ...where.price, gte: parseFloat(minPrice) };
    if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) };
    if (bedrooms) where.bedrooms = { gte: parseInt(bedrooms) };
    if (bathrooms) where.bathrooms = { gte: parseInt(bathrooms) };
    if (verified) where.verified = verified === 'true';
    
    // Add address filters if provided
    if (city || state) {
      where.address = {};
      if (city) where.address.city = city;
      if (state) where.address.state = state;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get properties with pagination
    const [properties, totalCount] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          address: true,
          features: true,
          media: {
            where: {
              isMain: true
            },
            take: 1
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.property.count({ where })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / take);

    res.json({
      message: 'Properties retrieved successfully',
      properties,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: take,
        pages: totalPages
      }
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ message: 'Server error retrieving properties', error: error.message });
  }
};

/**
 * Get property by ID
 * @route GET /api/properties/:id
 */
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        address: true,
        features: true,
        media: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Increment view count
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        views: {
          increment: 1
        }
      }
    });

    res.json({
      message: 'Property retrieved successfully',
      property
    });
  } catch (error) {
    console.error('Get property by ID error:', error);
    res.status(500).json({ message: 'Server error retrieving property', error: error.message });
  }
};

/**
 * Create new property
 * @route POST /api/properties
 */
const createProperty = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const {
      title,
      titleEn,
      description,
      descriptionEn,
      price,
      currency,
      type,
      status,
      bedrooms,
      bathrooms,
      buildingSize,
      landSize,
      constructionYear,
      address,
      features,
      media
    } = req.body;

    // Create property with nested relations
    const newProperty = await prisma.property.create({
      data: {
        title,
        titleEn,
        description,
        descriptionEn,
        price,
        currency: currency || 'MXN',
        type,
        status: status || 'ACTIVE',
        bedrooms,
        bathrooms,
        buildingSize,
        landSize,
        constructionYear,
        ownerId: userId,
        // Create address if provided
        address: address ? {
          create: address
        } : undefined,
        // Create features if provided
        features: features ? {
          create: features
        } : undefined,
        // Create media if provided
        media: media ? {
          create: media
        } : undefined
      },
      include: {
        address: true,
        features: true,
        media: true
      }
    });

    res.status(201).json({
      message: 'Property created successfully',
      property: newProperty
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ message: 'Server error creating property', error: error.message });
  }
};

/**
 * Update property
 * @route PUT /api/properties/:id
 */
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);
    const userId = req.userId; // From auth middleware
    
    // Get data to update
    const {
      title,
      titleEn,
      description,
      descriptionEn,
      price,
      currency,
      type,
      status,
      bedrooms,
      bathrooms,
      buildingSize,
      landSize,
      constructionYear,
      verified,
      address,
      features,
      media
    } = req.body;

    // Check if property exists and user is owner or admin
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { 
        owner: true 
      }
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Only owner or admin can update property
    if (property.ownerId !== userId && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }

    // Only admin can mark as verified
    if (verified !== undefined && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update verification status' });
    }

    // Build update object
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (titleEn !== undefined) updateData.titleEn = titleEn;
    if (description !== undefined) updateData.description = description;
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn;
    if (price !== undefined) updateData.price = price;
    if (currency !== undefined) updateData.currency = currency;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (bedrooms !== undefined) updateData.bedrooms = bedrooms;
    if (bathrooms !== undefined) updateData.bathrooms = bathrooms;
    if (buildingSize !== undefined) updateData.buildingSize = buildingSize;
    if (landSize !== undefined) updateData.landSize = landSize;
    if (constructionYear !== undefined) updateData.constructionYear = constructionYear;
    if (verified !== undefined) updateData.verified = verified;

    // Update property
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: updateData,
      include: {
        address: true,
        features: true,
        media: true
      }
    });

    // Update address if provided
    if (address) {
      // Check if address exists
      const existingAddress = await prisma.address.findUnique({
        where: { propertyId }
      });

      if (existingAddress) {
        await prisma.address.update({
          where: { propertyId },
          data: address
        });
      } else {
        await prisma.address.create({
          data: {
            ...address,
            propertyId
          }
        });
      }
    }

    // Handle features if provided
    if (features) {
      // First delete existing features
      await prisma.propertyFeature.deleteMany({
        where: { propertyId }
      });

      // Then create new ones
      await Promise.all(features.map(feature => 
        prisma.propertyFeature.create({
          data: {
            ...feature,
            propertyId
          }
        })
      ));
    }

    // Media handling would be more complex, typically done with a separate endpoint

    res.json({
      message: 'Property updated successfully',
      property: updatedProperty
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: 'Server error updating property', error: error.message });
  }
};

/**
 * Delete property
 * @route DELETE /api/properties/:id
 */
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);
    const userId = req.userId; // From auth middleware

    // Check if property exists and user is owner or admin
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { 
        owner: true 
      }
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Only owner or admin can delete property
    if (property.ownerId !== userId && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }

    // Delete property and all related data using cascade
    await prisma.property.delete({
      where: { id: propertyId }
    });

    res.json({
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Server error deleting property', error: error.message });
  }
};

/**
 * Add property to user favorites
 * @route POST /api/properties/:id/favorite
 */
const addToFavorites = async (req, res) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);
    const userId = req.userId; // From auth middleware

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if already in favorites
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    });

    if (existingFavorite) {
      return res.status(400).json({ message: 'Property already in favorites' });
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        propertyId
      }
    });

    res.status(201).json({
      message: 'Property added to favorites',
      favorite
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ message: 'Server error adding to favorites', error: error.message });
  }
};

/**
 * Remove property from user favorites
 * @route DELETE /api/properties/:id/favorite
 */
const removeFromFavorites = async (req, res) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);
    const userId = req.userId; // From auth middleware

    // Check if in favorites
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    });

    if (!existingFavorite) {
      return res.status(404).json({ message: 'Property not in favorites' });
    }

    // Remove from favorites
    await prisma.favorite.delete({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    });

    res.json({
      message: 'Property removed from favorites'
    });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ message: 'Server error removing from favorites', error: error.message });
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  addToFavorites,
  removeFromFavorites
};
