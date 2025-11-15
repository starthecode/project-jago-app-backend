import jwt from 'jsonwebtoken';

export const verifyRoute = (req, res, next) => {
  let token;
  let authHeader = req.headers.Authorization || req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: 'no token, authorization denied' });
    }

    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decode;
      next();
    } catch (error) {
      res.status(400).json({ message: 'Tokenis not valid' });
    }
  } else {
    return res.status(401).json({ message: 'no token, authorization denied' });
  }
};
