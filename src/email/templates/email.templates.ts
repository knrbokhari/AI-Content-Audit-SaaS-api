export const emailTemplates = {
  verifyEmail: (name: string, code: string) => ({
    subject: 'Verify your ContentPilot AI account',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:8px">
        <h2 style="color:#1a1a1a">Verify your email</h2>
        <p style="color:#444">Hi ${name},</p>
        <p style="color:#444">Use the OTP below to verify your ContentPilot AI account. It expires in <strong>5 minutes</strong>.</p>
        <div style="text-align:center;margin:32px 0">
          <span style="display:inline-block;padding:16px 32px;background:#4f46e5;color:#fff;font-size:32px;font-weight:bold;letter-spacing:8px;border-radius:8px">${code}</span>
        </div>
        <p style="color:#888;font-size:13px">If you didn't create an account, you can ignore this email.</p>
      </div>
    `,
  }),

  resendOtp: (name: string, code: string) => ({
    subject: 'Your new ContentPilot AI OTP',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:8px">
        <h2 style="color:#1a1a1a">New verification code</h2>
        <p style="color:#444">Hi ${name},</p>
        <p style="color:#444">Here is your new OTP. It expires in <strong>5 minutes</strong>.</p>
        <div style="text-align:center;margin:32px 0">
          <span style="display:inline-block;padding:16px 32px;background:#4f46e5;color:#fff;font-size:32px;font-weight:bold;letter-spacing:8px;border-radius:8px">${code}</span>
        </div>
        <p style="color:#888;font-size:13px">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  }),

  forgotPassword: (name: string, code: string) => ({
    subject: 'Reset your ContentPilot AI password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:8px">
        <h2 style="color:#1a1a1a">Reset your password</h2>
        <p style="color:#444">Hi ${name},</p>
        <p style="color:#444">Use the OTP below to reset your password. It expires in <strong>5 minutes</strong>.</p>
        <div style="text-align:center;margin:32px 0">
          <span style="display:inline-block;padding:16px 32px;background:#dc2626;color:#fff;font-size:32px;font-weight:bold;letter-spacing:8px;border-radius:8px">${code}</span>
        </div>
        <p style="color:#888;font-size:13px">If you didn't request a password reset, you can ignore this email.</p>
      </div>
    `,
  }),
};
