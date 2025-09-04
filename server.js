const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const xssClean = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");

const errorHandler = require("./middlewares/errorHandler");
// const { limiter } = require("./utils/rateLimiter");

const routes = require("./routes");
const morgan = require("morgan");
// const logger = require("./utils/logger");

const app = express();

const allowedOrigins = process.env.CLIENT_URL.split(",");
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(helmet());

app.set("trust proxy", true);
// app.use(limiter);

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(cookieParser());

// app.use(session({
//   secret: 'yourSecret',
//   resave: false,
//   saveUninitialized: true,
//   cookie: {
//     secure: true,          // only over HTTPS
//     httpOnly: true,        // not accessible via JavaScript
//     sameSite: 'Strict'     // CSRF protection
//   }
// }));

// // app.use(morgan("combined", { stream: logger.stream }));
// app.use(morgan("dev"));

app.use(xssClean());

app.use(hpp());

app.use(routes);

require("./jobs")();

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
