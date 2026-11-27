function registrationEmail(code) {
  const subject = 'Verifica tu correo · Huellas PetID';
  const message = [
    'Verifica tu correo para crear tu cuenta de Huellas PetID.',
    `Tu código de verificación es ${code}.`,
    'Ingresa el código en la pantalla de registro. Vence en 10 minutos.',
    'Si tú no solicitaste este código, puedes ignorar este correo.',
  ].join('\n\n');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#eef5f2;color:#182a27;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Confirma tu correo para completar el registro en Huellas PetID.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#eef5f2;">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#ffffff;border:1px solid #cbded6;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:20px 28px;background-color:#123d36;color:#ffffff;font-size:20px;line-height:1.4;font-weight:bold;">
              Huellas PetID
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2;color:#123d36;">Verifica tu correo</h1>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.55;">Ingresa este código en la pantalla de registro para crear tu cuenta.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#e9f5ef;border:1px solid #bcdccf;border-radius:12px;">
                <tr>
                  <td align="center" style="padding:18px 10px 6px;color:#28574d;font-size:14px;font-weight:bold;">Código de verificación</td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 10px 18px;color:#123d36;font-family:Consolas,'Courier New',monospace;font-size:36px;line-height:1.2;font-weight:bold;letter-spacing:5px;">${code}</td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:15px;line-height:1.55;">Este código vence en <strong>10 minutos</strong>.</p>
              <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #dce8e3;color:#465c56;font-size:14px;line-height:1.5;">Si tú no solicitaste este código, puedes ignorar este correo.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, message, html };
}

module.exports = { registrationEmail };
