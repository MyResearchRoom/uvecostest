const crypto = require("crypto");
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
const ALGORITHM = "aes-256-cbc";

exports.encryptSensitiveData = (data) => {
  const iv = crypto.randomBytes(16); // Initialization vector
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_SECRET, "hex"),
    iv
  );
  let encrypted = cipher.update(data, "utf-8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

exports.decryptSensitiveData = (encryptedData) => {
  if (!encryptedData || typeof encryptedData !== "string") {
    return null; // Return null if no data or invalid data type
  }

  const [ivHex, encryptedHex] = encryptedData.split(":"); // Split the IV and the encrypted data
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_SECRET, "hex"),
    Buffer.from(ivHex, "hex")
  );

  let decrypted = decipher.update(
    Buffer.from(encryptedHex, "hex"),
    "hex",
    "utf-8"
  );
  decrypted += decipher.final("utf-8");

  // Decrypted data is base64 encoded at this point
  return decrypted; // Return the base64 string directly
};

exports.getDecryptedDocumentAsBase64 = (bufferData) => {
  if (!bufferData) return null;

  // Step 1: Convert Buffer (BLOB) to a string
  const encryptedData = bufferData.toString("utf-8");

  // Step 2: Decrypt the data
  const decryptedData = exports.decryptSensitiveData(encryptedData);

  // Step 3: Return decrypted data (already base64 from encryption process)
  return decryptedData;
};
