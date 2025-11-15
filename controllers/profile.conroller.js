import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import { errorhandler } from '../utils/error.js';

export const profile = async (req, res, next) => {
  const { userName, firstName, lastName, email, password, profilePicture } =
    req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return next(errorhandler(404, 'User not found'));
    }

    // If password is provided, validate it before allowing updates
    if (password && password !== '') {
      const isValid = bcryptjs.compareSync(password, user.password);
      if (!isValid) {
        return next(errorhandler(400, 'Invalid password'));
      }
    }

    // Update user fields
    user.userName = userName || user.userName;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.profilePicture = profilePicture || user.profilePicture;

    await user.save();

    const { password: pw, ...rest } = user._doc;
    res.status(200).json(rest);
  } catch (error) {
    return next(error);
  }
};
