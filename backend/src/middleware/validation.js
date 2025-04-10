const Joi = require('joi');

/**
 * Validate request data against a schema
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {function} Middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property]);
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({ message: errorMessage });
    }
    next();
  };
};

// User schemas
const userSchemas = {
  // Registration schema
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string().allow('', null),
    language: Joi.string().valid('SPANISH', 'ENGLISH').default('SPANISH')
  }),

  // Login schema
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Update user schema
  updateUser: Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    phone: Joi.string().allow('', null),
    language: Joi.string().valid('SPANISH', 'ENGLISH'),
    password: Joi.string().min(6),
    role: Joi.string().valid('USER', 'AGENT', 'ADMIN')
  }).min(1) // At least one field must be provided
};

// Property schemas
const propertySchemas = {
  // Create property schema
  createProperty: Joi.object({
    title: Joi.string().required(),
    titleEn: Joi.string().allow('', null),
    description: Joi.string().required(),
    descriptionEn: Joi.string().allow('', null),
    price: Joi.number().positive().required(),
    currency: Joi.string().valid('MXN', 'USD').default('MXN'),
    type: Joi.string().valid('HOUSE', 'APARTMENT', 'LAND', 'COMMERCIAL').required(),
    status: Joi.string().valid('ACTIVE', 'SOLD', 'RENTED', 'INACTIVE').default('ACTIVE'),
    bedrooms: Joi.number().integer().min(0).allow(null),
    bathrooms: Joi.number().integer().min(0).allow(null),
    buildingSize: Joi.number().positive().allow(null),
    landSize: Joi.number().positive().allow(null),
    constructionYear: Joi.number().integer().min(1800).max(new Date().getFullYear()).allow(null),
    address: Joi.object({
      street: Joi.string().allow('', null),
      streetNumber: Joi.string().allow('', null),
      neighborhood: Joi.string().required(),
      postalCode: Joi.string().allow('', null),
      city: Joi.string().required(),
      state: Joi.string().required(),
      latitude: Joi.number().min(-90).max(90).allow(null),
      longitude: Joi.number().min(-180).max(180).allow(null)
    }),
    features: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        nameEn: Joi.string().allow('', null)
      })
    ),
    media: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('IMAGE', 'FLOOR_PLAN', 'VIDEO').required(),
        url: Joi.string().uri().required(),
        isMain: Joi.boolean().default(false)
      })
    )
  }),

  // Update property schema
  updateProperty: Joi.object({
    title: Joi.string(),
    titleEn: Joi.string().allow('', null),
    description: Joi.string(),
    descriptionEn: Joi.string().allow('', null),
    price: Joi.number().positive(),
    currency: Joi.string().valid('MXN', 'USD'),
    type: Joi.string().valid('HOUSE', 'APARTMENT', 'LAND', 'COMMERCIAL'),
    status: Joi.string().valid('ACTIVE', 'SOLD', 'RENTED', 'INACTIVE'),
    bedrooms: Joi.number().integer().min(0).allow(null),
    bathrooms: Joi.number().integer().min(0).allow(null),
    buildingSize: Joi.number().positive().allow(null),
    landSize: Joi.number().positive().allow(null),
    constructionYear: Joi.number().integer().min(1800).max(new Date().getFullYear()).allow(null),
    verified: Joi.boolean(),
    address: Joi.object({
      street: Joi.string().allow('', null),
      streetNumber: Joi.string().allow('', null),
      neighborhood: Joi.string(),
      postalCode: Joi.string().allow('', null),
      city: Joi.string(),
      state: Joi.string(),
      latitude: Joi.number().min(-90).max(90).allow(null),
      longitude: Joi.number().min(-180).max(180).allow(null)
    }),
    features: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        nameEn: Joi.string().allow('', null)
      })
    )
  }).min(1), // At least one field must be provided

  // Property search schema
  propertySearch: Joi.object({
    type: Joi.string().valid('HOUSE', 'APARTMENT', 'LAND', 'COMMERCIAL'),
    minPrice: Joi.number().positive(),
    maxPrice: Joi.number().positive().greater(Joi.ref('minPrice')),
    bedrooms: Joi.number().integer().min(0),
    bathrooms: Joi.number().integer().min(0),
    city: Joi.string(),
    state: Joi.string(),
    status: Joi.string().valid('ACTIVE', 'SOLD', 'RENTED', 'INACTIVE').default('ACTIVE'),
    verified: Joi.boolean(),
    limit: Joi.number().integer().min(1).max(100).default(10),
    page: Joi.number().integer().min(1).default(1)
  })
};

// Media schemas
const mediaSchemas = {
  // Update media schema
  updateMedia: Joi.object({
    isMain: Joi.boolean().required()
  })
};

module.exports = {
  validate,
  userSchemas,
  propertySchemas,
  mediaSchemas
};
