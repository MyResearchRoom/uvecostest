const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { access_jwt_secret } = require("../config/config");

// Role-based authentication middleware
const publicAuth = () => {
  return async (req, res, next) => {
    try {
      // Retrieve the token from the Authorization header
      const token = req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        next();
        return;
      }

      // Verify the token
      const decoded = jwt.verify(token, access_jwt_secret);

      console.log(decoded);

      // Fetch the user from the database
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. User not found.",
        });
      }

      // Attach user details to the request object for downstream use
      req.user = user;

      next();
    } catch (error) {
      next();
    }
  };
};

module.exports = publicAuth;
