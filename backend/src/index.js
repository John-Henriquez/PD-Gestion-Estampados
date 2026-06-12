"use strict";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import indexRoutes from "./routes/index.routes.js";
import session from "express-session";
import passport from "passport";
import express, { json, urlencoded } from "express";
import { cookieKey, HOST, PORT } from "./config/configEnv.js";
import { connectDB } from "./config/configDb.js";
import { initialSetup } from "./config/initialSetup.js";
import { passportJwtSetup } from "./auth/passport.auth.js";

dotenv.config();

async function setupServer() {
  try {
    const app = express();

    app.disable("x-powered-by");

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
        .split(',')
        .map(o => o.trim());

      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

    app.use(urlencoded({extended: true, limit: "1mb"}));
    app.use(json({limit: "1mb"}));
    app.use(cookieParser());
    app.use(morgan("dev"));

    app.get("/order-confirmation/:id", (req, res) => {
      const { id } = req.params;
      const { payment_id, status } = req.query;
      console.log(`🚀 Redirigiendo Orden #${id} al Frontend local...`);
      res.redirect(`${FRONTEND_URL}/order-confirmation/${id}?payment_id=${payment_id}&status=${status}`);
    });

    app.use(
      session({
        secret: cookieKey,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          httpOnly: true,  
        }
      }),
    );

    app.use(passport.initialize());
    app.use(passport.session());

    passportJwtSetup();

    app.use("/uploads", express.static("uploads"));
    app.use("/api", indexRoutes);

    app.listen(PORT, () => {
      console.log(`=> Servidor corriendo en ${HOST}:${PORT}`);
    });
  } catch (error) {
    console.log("Error en index.js -> setupServer(), el error es: ", error);
  }
}

async function setupAPI() {
  await connectDB();
  await initialSetup();  
  await setupServer();
}

setupAPI()
  .then(() => console.log("=> API Iniciada exitosamente"))
  .catch((error) =>
    console.log("Error en index.js -> setupAPI(), el error es: ", error),
  );
