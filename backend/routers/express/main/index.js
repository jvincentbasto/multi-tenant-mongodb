import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import multer from "multer";
import dotenv from "dotenv";

import { base } from "../base.js";

// envs
dotenv.config();

// init
const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

//
const startServer = async (payload = {}) => {
  const { success, getDomains } = payload;

  try {
    if (!success) {
      throw new Error("Failed to Start Database");
    }

    // origins
    const validateOrigins = (payload = {}) => {
      // const {} = payload

      return (origin, callback) => {
        // dev
        if (false) {
          callback(null, origin || "*");
          return;
        }

        const allowedOrigins = ["http://localhost:3000"];
        const dynamicDomains = getDomains();
        const curDomains = [...allowedOrigins, ...dynamicDomains];
        const uniqueDomains = [...new Set(curDomains)];
        // console.log("uniqueDomains", uniqueDomains);

        // Allow all localhost origins regardless of port
        const localhostRegex = /^http:\/\/localhost:\d+$/;
        const allowedLocalhost = localhostRegex.test(origin);
        if (allowedLocalhost) {
          return callback(null, true);
        }

        // allow requests with no origin (like Postman or curl)
        if (!origin) return callback(null, true);

        //
        if (uniqueDomains.includes(origin)) {
          return callback(null, true);
        } else {
          return callback(new Error("Not allowed by CORS"));
        }
      };
    };

    // initial domains
    app.use(cors({ origin: validateOrigins(), credentials: true }));

    //
    const upload = multer();
    app.use(express.json()); // parse incoming requests
    app.use(express.urlencoded({ extended: true })); // parse incoming form-urlencoded
    app.use(upload.none()); // parse incoming form-data
    app.use(cookieParser()); // parse incoming cookies

    // routes
    app.use("/api", base.router);

    // frontend
    // if (process.env.NODE_ENV === "production") {
    //   app.use(express.static(path.join(__dirname, "/frontend/dist")));
    //   app.get("*", (req, res) => {
    //     res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    //   });
    // }

    //
    app.listen(PORT, () => {
      console.log("Server is running on port:", PORT);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1); // status code: failure = 1, success = 0
  }
};
export const expressHandlers = {
  startServer,
};
