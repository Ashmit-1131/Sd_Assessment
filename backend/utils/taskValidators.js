
const Joi = require('joi');

const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(250).required(),
  description: Joi.string().allow('', null),
  effortDays: Joi.number().integer().min(0).optional(),
  dueDate: Joi.date().iso().optional().allow(null, '')
});

const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(250).optional(),
  description: Joi.string().allow('', null),
  effortDays: Joi.number().integer().min(0).optional(),
  dueDate: Joi.date().iso().optional().allow(null, '')
});

module.exports = { createTaskSchema, updateTaskSchema };
