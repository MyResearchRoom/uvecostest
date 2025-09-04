const twilio = require("twilio");

exports.generateOTP = () => {
  return Math.floor(1000 + Math.random() * 900000).toString(); // Generate a 4-digit OTP
};

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const client = twilio(accountSid, authToken);

exports.sendOTP = async (mobileNumber, otp) => {
  // const message = `Your OTP for registration is ${otp}. It is valid for 5 minutes.`;
  // await client.messages.create({
  //   body: message,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: mobileNumber,
  // });
  console.log(mobileNumber, otp);
};
