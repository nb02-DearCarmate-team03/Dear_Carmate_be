import nodemailer from 'nodemailer';

interface EmailAttachment {
  filename: string;
  path: string;
}

export default class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: EmailAttachment[],
  ): Promise<void> {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: process.env.SMTP_FROM || 'noreply@carmate.com',
        to,
        subject,
        html,
        attachments,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`이메일 발송 성공: ${to}`);
    } catch (error) {
      console.error(`이메일 발송 실패: ${to}`, error);
      // 이메일 발송 실패해도 프로세스는 계속 진행
    }
  }
}
