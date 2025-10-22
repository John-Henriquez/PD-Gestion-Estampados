/* "use strict";

import transporter from "../config/mailer.js";

export async function sendEmailController(req, res) {
  try {
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    console.log("Enviando correo a:", to);

    const info = await transporter.sendMail({
      from: `"Soporte" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
    });

    if (!info.messageId) {
      return res.status(500).json({ error: "No se pudo enviar el correo" });
    }

    return res.status(200).json({ message: "Correo enviado con éxito", info });
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

 */
