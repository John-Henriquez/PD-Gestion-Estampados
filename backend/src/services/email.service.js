"use strict";

import transporter from "../config/mailer.js";

export async function sendEmail(to, subject, text) {
  console.log(`Intentando enviar correo a ${to} con asunto: ${subject}`);
  try {
    const info = await transporter.sendMail({
      from: `"Soporte" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
    });
    console.log("Correo enviado:", info.messageId);
    return [info, null];
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    return [null, "Error al enviar el correo"];
  }
}
