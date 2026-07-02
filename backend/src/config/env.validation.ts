import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),

  MONGO_URI: Joi.string().required().messages({
    'any.required': 'MONGO_URI is required in environment config',
  }),

  REDIS_HOST: Joi.string().required().messages({
    'any.required': 'REDIS_HOST is required in environment config',
  }),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().default(0),

  WEBHOOK_RETRY_LIMIT: Joi.number().default(5),
  WEBHOOK_RETRY_DELAY_MS: Joi.number().default(5000),
});
