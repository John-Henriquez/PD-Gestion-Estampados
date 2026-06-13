"use strict";
import dotenv from "dotenv";

dotenv.config();

const REQUIRED_VARS = [
  "DB_USERNAME", "PASSWORD", "DATABASE",
  "ACCESS_TOKEN_SECRET", "cookieKey",
  "ADMIN_EMAIL", "ADMIN_PASSWORD",
];

const missing = REQUIRED_VARS.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`Error: faltan variables de entorno obligatorias: ${missing.join(", ")}`);
  process.exit(1);
}

export const PORT                = process.env.PORT            || 3000;
export const HOST                = process.env.HOST            || "localhost";
export const NODE_ENV            = process.env.NODE_ENV        || "development";
export const DB_USERNAME         = process.env.DB_USERNAME;
export const PASSWORD            = process.env.PASSWORD;
export const DATABASE            = process.env.DATABASE;
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
export const cookieKey           = process.env.cookieKey;
export const EMAIL_USER          = process.env.EMAIL_USER;
export const EMAIL_PASS          = process.env.EMAIL_PASS;
export const MP_ACCESS_TOKEN     = process.env.MP_ACCESS_TOKEN;
export const FRONTEND_URL        = process.env.FRONTEND_URL;
export const BACKEND_URL         = process.env.BACKEND_URL;
export const ALLOWED_ORIGINS     = process.env.ALLOWED_ORIGINS;
export const ADMIN_EMAIL         = process.env.ADMIN_EMAIL;
export const ADMIN_PASSWORD      = process.env.ADMIN_PASSWORD;
export const ADMIN_RUT           = process.env.ADMIN_RUT;