const Joi = require('joi');

const optionalString = (max = 200) => Joi.string().trim().max(max).allow('', null);

const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).required()
    .messages({
      'string.empty': 'First name is required',
      'any.required': 'First name is required',
    }),
  middleName: optionalString(100),
  lastName: Joi.string().trim().min(1).max(100).required()
    .messages({
      'string.empty': 'Last name is required',
      'any.required': 'Last name is required',
    }),
  username: optionalString(50),
  phoneNumber: optionalString(30),
  address: optionalString(500),
  addressLine2: optionalString(200),
  city: optionalString(100),
  state: optionalString(50),
  zip: optionalString(20),
  profilePicture: Joi.string().trim().max(4_000_000).allow('', null),
}).min(1);

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => {
        if (detail.type === 'any.custom' && detail.context?.message) {
          return detail.context.message;
        }
        return detail.message;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    req[property] = value;
    next();
  };
};

module.exports = {
  updateProfileSchema,
  validate,
};
