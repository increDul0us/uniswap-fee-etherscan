import express from 'express';
import Joi from 'joi';

const backfillSchema = Joi.object({
  startTime: Joi.string().pattern(/^[1-9]\d*$/).length(10).required(),
  endTime: Joi.string().pattern(/^[1-9]\d*$/).length(10).required(),
}).custom((value, helpers) => {
  if (parseInt(value.startTime) >= parseInt(value.endTime)) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'greaterThan');

const hashParamSchema = Joi.object({
  hash: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/).required(),
});

export function validateBackfillParams(req: express.Request, res: express.Response, next: express.NextFunction) {
  const { error } = backfillSchema.validate(req.query);
  if (error) {
    return res.status(400).json({ status: 'error', error: error.details[0].message });
  }
  next();
}

export function validateHashParam(req: express.Request, res: express.Response, next: express.NextFunction) {
  const { error } = hashParamSchema.validate(req.params);
  if (error) {
    return res.status(400).json({ status: 'error', error: error.message });
  }
  next();
}
