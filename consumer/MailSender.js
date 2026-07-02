import nodemailer from "nodemailer";

class MailSender {
  constructor() {
    this._transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  sendEmail(targetEmail, { applicantEmail, applicantName, appliedAt }) {
    const message = {
      from: "Open Job Notification <noreply@openjob.com>",
      to: targetEmail,
      subject: "Ada Pelamar Baru untuk Lowongan Anda",
      html: `
        <h2>Notifikasi Lamaran Baru</h2>
        <p>Seseorang telah melamar lowongan pekerjaan Anda.</p>
        <table>
          <tr>
            <td>Nama Pelamar</td>
            <td>: <strong>${applicantName}</strong></td>
          </tr>
          <tr>
            <td>Email Pelamar</td>
            <td>: <strong>${applicantEmail}</strong></td>
          </tr>
          <tr>
            <td>Tanggal Melamar</td>
            <td>: <strong>${new Date(appliedAt).toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</strong></td>
          </tr>
        </table>
      `,
    };

    return this._transporter.sendMail(message);
  }

  sendEmailGeneric(targetEmail, subject, htmlBody) {
    const message = {
      from: "Open Job Notification <noreply@openjob.com>",
      to: targetEmail,
      subject,
      html: htmlBody,
    };

    return this._transporter.sendMail(message);
  }
}

export default MailSender;