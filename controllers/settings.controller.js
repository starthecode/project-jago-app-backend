import { errorhandler } from '../utils/error.js';

import Setting from '../models/settings.model.js';

export const updateSettings = async (req, res, next) => {
  if (!req.user.isAdmin) {
    return next(errorhandler(403, 'You are not allowed to create the post'));
  }

  const { userId, googleId } = req.body;

  try {
    const updatedSettings = await Setting.findOneAndUpdate(
      { userId }, // find by userId
      { googleId }, // update fields
      {
        new: true, // return the updated document
        upsert: true, // create if it doesn't exist
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({
      success: true,
      settings: updatedSettings,
    });
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (req, res, next) => {
  try {
    const settings = await Setting.find();

    res.status(200).json({
      settings,
    });
  } catch (error) {
    next(error);
  }
};
