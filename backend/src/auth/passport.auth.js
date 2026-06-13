"use strict";
import passport from "passport"; 
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { ACCESS_TOKEN_SECRET } from "../config/configEnv.js"; 

const cookieExtractor = (req) => req?.cookies?.jwt || null;

const options = {
  jwtFromRequest: cookieExtractor,  
  secretOrKey: ACCESS_TOKEN_SECRET,
};

passport.use(
  new JwtStrategy(options, (jwt_payload, done) => {
    try {
      if (!jwt_payload?.id) return done(null, false);
      return done(null, {
        id: jwt_payload.id,
        email: jwt_payload.email,
        rol: jwt_payload.rol,
        rut: jwt_payload.rut,
        nombreCompleto: jwt_payload.nombreCompleto,
      });
    } catch (error) {
      return done(error, false);
    }
  }),
);

export function passportJwtSetup() {
  passport.initialize();
}
