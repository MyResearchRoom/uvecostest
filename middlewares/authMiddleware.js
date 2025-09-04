const jwt = require("jsonwebtoken");
const { User, Company } = require("../models");
const { access_jwt_secret } = require("../config/config");

// Role-based authentication middleware
const authenticate = (requiredRoles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. Token is missing.",
        });
      }

      const decoded = jwt.verify(token, access_jwt_secret);

      console.log(decoded);

      const includes = [];
      if (req.url.startsWith("/me")) {
        if (decoded.role === "companyUser") {
          includes.push({
            model: Company,
            as: "companies",
            attributes: ["companyName"],
            required: false,
          });
        } else {
          includes.push({
            model: Company,
            as: "company",
            attributes: ["companyName"],
            required: false,
          });
        }
      }

      const user = await User.findByPk(decoded.id, {
        include: includes,
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. User not found.",
        });
      }

      if (req.url.startsWith("/me")) {
        return res.status(200).json({
          success: true,
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            mobileNumger: user.mobileNumber,
            role: user.role,
            companyId: user.companyId,
            companyName:
              decoded.role === "companyUser"
                ? user.companies[0]?.companyName
                : user.company?.companyName,
          },
        });
      }

      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden. You do not have access to this resource.",
        });
      }

      if (user.role === "companyUser") {
        user["companyId"] = decoded.companyId;
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. Token has expired.",
        });
      } else if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. Invalid token.",
        });
      }

      res.status(500).json({
        message: "Internal Server Error. Authentication failed.",
        success: false,
      });
    }
  };
};

module.exports = authenticate;
