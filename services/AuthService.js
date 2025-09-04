const { User, Store } = require("../models");
const bcrypt = require("bcrypt");

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

async function sendOtpToUser(user, otp) {
  console.log(`Sending OTP ${otp} to ${user.mobileNumber}`);
}

exports.getCompanyOwnStore = async (companyId) => {
  try {
    const stores = await User.findAll({
      where: {
        companyId,
        role: "store",
      },
      attributes: ["id", "companyId", "role"],
      include: [
        {
          model: Store,
          as: "store",
          where: {
            storeType: "companyOwnStore",
          },
          required: true,
        },
      ],
    });
    const storeIds = stores ? stores.map((store) => store.id) : [];
    return storeIds;
  } catch (error) {
    throw error;
  }
};

exports.getStoreType = async (storeId) => {
  try {
    const store = await Store.findOne({
      where: {
        userId: storeId,
      },
      attributes: ["id", "storeType"],
    });

    if (!store) {
      throw new Error("Store not found");
    }

    return store.storeType;
  } catch (error) {
    throw error;
  }
};

exports.sendForgotPasswordOTP = async (mobileNumber) => {
  const user = await User.findOne({ where: { mobileNumber } });
  if (!user) {
    throw new Error("User not found");
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  user.otp = otp;
  user.otpExpiry = otpExpiry;
  await user.save();

  await sendOtpToUser(user, otp);
  return { message: "OTP sent successfully" };
};

exports.verifyOTP = async (mobileNumber, otp) => {
  const user = await User.findOne({ where: { mobileNumber } });
  if (!user || user.otp !== otp || new Date() > new Date(user.otpExpiry)) {
    throw new Error("Invalid or expired OTP");
  }

  return { message: "OTP verified successfully" };
};

exports.resetPassword = async (mobileNumber, otp, newPassword) => {
  const user = await User.findOne({ where: { mobileNumber } });
  if (!user || user.otp !== otp || new Date() > new Date(user.otpExpiry)) {
    throw new Error("Invalid or expired OTP");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.otp = null;
  user.otpExpiry = null;
  await user.save();

  return { message: "Password reset successfully" };
};
