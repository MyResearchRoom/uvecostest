exports.generateRandomOrderId = () => {
  const prefix = "ORD";
  const randomPart = Math.random().toString(36).substring(6, 10).toUpperCase(); // 4 chars
  const timestamp = Date.now().toString().slice(-6); // last 6 digits of timestamp
  return `${prefix}${randomPart}${timestamp}`;
};

exports.generateRandomClaimId = () => {
  const prefix = "CLM";
  const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6 digits
  return `${prefix}${randomDigits}`;
};

exports.generateRandomSerialNo = () => {
  const prefix = "SN";
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000); // 8 digits
  return `${prefix}${randomDigits}`;
};
