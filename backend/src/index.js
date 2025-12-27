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
        credentials: true,
        origin: 'http://localhost:5173',
      }),
    );

    app.use(urlencoded({extended: true, limit: "1mb"}));
    app.use(json({limit: "1mb"}));
    app.use(cookieParser());
    app.use(morgan("dev"));

    app.get("/order-confirmation/:id", (req, res) => {
      const { id } = req.params;
      const { payment_id, status } = req.query;
      console.log(`🚀 Redirigiendo Orden #${id} al Frontend local...`);
      res.redirect(`http://localhost:5173/order-confirmation/${id}?payment_id=${payment_id}&status=${status}`);
    });

    app.use(
      session({
        secret: cookieKey,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: true,
          httpOnly: true,
          sameSite: "none",
        },
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
  try {
    await connectDB();
    await setupServer();
    await initialSetup();
  } catch (error) {
    console.log("Error en index.js -> setupAPI(), el error es: ", error);
  }
}

setupAPI()
  .then(() => console.log("=> API Iniciada exitosamente"))
  .catch((error) =>
    console.log("Error en index.js -> setupAPI(), el error es: ", error),
  );
