import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';

type EmailAttachment = { filename: string; path: string };

export default class EmailService {
  private transporter: Transporter | null = null;
  private readonly from =
    process.env.SMTP_FROM || process.env.EMAIL_FROM || 'no-reply@carmate.local';

  private readonly disabled = process.env.SMTP_DISABLED === 'true';

  /** 트랜스포터 생성(없으면 dev에서 Ethereal, prod에선 비활성) */
  private async getTransporter(): Promise<Transporter | null> {
    if (this.disabled) return null;
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 0);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

    // 정상 설정이 있으면 그걸 사용
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port || (secure ? 465 : 587),
        secure, // 465면 true, 587이면 false
        auth: { user, pass },
      });
      return this.transporter;
    }

    // 설정이 없을 때: 운영은 끄고, 개발은 Ethereal 테스트 SMTP 사용
    if (process.env.NODE_ENV === 'production') return null;

    const test = await nodemailer.createTestAccount();
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: test.user, pass: test.pass },
    });
    return this.transporter;
  }

  async sendEmail(
    to: string | null | undefined,
    subject: string,
    html: string,
    attachments: EmailAttachment[] = [],
  ): Promise<void> {
    try {
      if (!to) {
        console.warn('[email] 수신자 없음 → 전송 스킵');
        return;
      }
      const transporter = await this.getTransporter();
      if (!transporter) {
        console.warn('[email] SMTP 미설정/비활성 → 전송 스킵');
        return;
      }

      const mailOptions: SendMailOptions = {
        from: this.from,
        to,
        subject,
        html,
        attachments,
      };

      const info = await transporter.sendMail(mailOptions);
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) console.log('[email] Preview URL:', preview);
      console.log(`[email] sent → ${to}`);
    } catch (err) {
      console.error('[email] 전송 실패:', (err as Error).message);
      // 실패해도 플로우는 계속
    }
  }
}
