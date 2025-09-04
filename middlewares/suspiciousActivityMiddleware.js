const suspiciousIPs = new Map(); // Store IP addresses and their hit counts
const BLOCK_THRESHOLD = 100; // Number of requests per 5 mins to block
const WINDOW_TIME = 5 * 60 * 1000; // 5 minutes

function suspiciousActivityMiddleware(req, res, next) {
  const ip = req.ip;

  const now = Date.now();
  if (!suspiciousIPs.has(ip)) {
    suspiciousIPs.set(ip, { count: 1, firstRequestTime: now });
  } else {
    const data = suspiciousIPs.get(ip);

    if (now - data.firstRequestTime < WINDOW_TIME) {
      data.count += 1;
      suspiciousIPs.set(ip, data);

      if (data.count > BLOCK_THRESHOLD) {
        console.warn(`⚠️ Blocking suspicious IP: ${ip}`);
        return res
          .status(429)
          .json({ error: "Too many requests. IP temporarily blocked." });
      }
    } else {
      // Reset if window time passed
      suspiciousIPs.set(ip, { count: 1, firstRequestTime: now });
    }
  }

  next();
}

module.exports = suspiciousActivityMiddleware;
