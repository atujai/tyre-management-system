import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailNotification {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmailNotification(notification: EmailNotification): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"Truck Management System" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: notification.to,
      subject: notification.subject,
      text: notification.text || notification.html.replace(/<[^>]*>/g, ''),
      html: notification.html,
    });
    console.log(`Email sent: ${notification.subject}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export async function sendDocumentExpiryReminder(
  documentId: string,
  daysUntilExpiry: number
): Promise<void> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      truck: { select: { number: true, model: true } },
    },
  });

  if (!document) return;

  const isExpired = daysUntilExpiry <= 0;
  const subject = isExpired
    ? `URGENT: ${document.title} has EXPIRED - Truck ${document.truck?.number}`
    : `Reminder: ${document.title} expires in ${daysUntilExpiry} days - Truck ${document.truck?.number}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">🚛 Truck Management System</h1>
      </div>

      <div style="padding: 30px; background: #f8f9fa;">
        <div style="background: ${isExpired ? '#dc2626' : '#f59e0b'}; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 18px;">
            ${isExpired ? '⚠️ DOCUMENT EXPIRED' : '⏰ DOCUMENT EXPIRING SOON'}
          </h2>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #1a1a2e; margin-top: 0;">${document.title}</h3>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Truck</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">${document.truck?.number} (${document.truck?.model})</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Document Type</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">${document.type}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Document Number</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">${document.number || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Expiry Date</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: ${isExpired ? '#dc2626' : '#f59e0b'};">
                ${document.expiryDate ? new Date(document.expiryDate).toLocaleDateString('en-IN') : 'N/A'}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666;">Days Remaining</td>
              <td style="padding: 10px 0; font-weight: bold; color: ${isExpired ? '#dc2626' : '#f59e0b'};">
                ${isExpired ? 'EXPIRED' : `${daysUntilExpiry} days`}
              </td>
            </tr>
          </table>

          ${document.notes ? `
          <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 6px;">
            <strong style="color: #666;">Notes:</strong>
            <p style="margin: 5px 0 0; color: #333;">${document.notes}</p>
          </div>
          ` : ''}
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/documents" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Documents
          </a>
        </div>
      </div>

      <div style="background: #1a1a2e; color: #888; padding: 20px; text-align: center; font-size: 12px;">
        <p>This is an automated reminder from Truck Management System.</p>
        <p>Please do not reply to this email.</p>
      </div>
    </div>
  `;

  await sendEmailNotification({
    to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
    subject,
    html,
  });
}

export async function sendDocumentRenewalConfirmation(
  documentId: string,
  newExpiryDate: Date
): Promise<void> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      truck: { select: { number: true, model: true } },
    },
  });

  if (!document) return;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #059669; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">✅ Document Renewed Successfully</h1>
      </div>

      <div style="padding: 30px; background: #f8f9fa;">
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #1a1a2e; margin-top: 0;">${document.title}</h3>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Truck</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">${document.truck?.number}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">New Expiry Date</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #059669;">
                ${newExpiryDate.toLocaleDateString('en-IN')}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666;">Renewal Cost</td>
              <td style="padding: 10px 0; font-weight: bold;">
                ${document.renewalCost ? `₹${document.renewalCost}` : 'N/A'}
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/documents" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Documents
          </a>
        </div>
      </div>
    </div>
  `;

  await sendEmailNotification({
    to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
    subject: `✅ Document Renewed: ${document.title} - Truck ${document.truck?.number}`,
    html,
  });
}

export async function sendDailySummary(): Promise<void> {
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [expired, expiring7, expiring30] = await Promise.all([
    prisma.document.count({
      where: { expiryDate: { lt: now }, status: { not: 'ARCHIVED' } },
    }),
    prisma.document.count({
      where: { expiryDate: { lte: sevenDays, gte: now }, status: { not: 'ARCHIVED' } },
    }),
    prisma.document.count({
      where: { expiryDate: { lte: thirtyDays, gte: now }, status: { not: 'ARCHIVED' } },
    }),
  ]);

  if (expired === 0 && expiring7 === 0 && expiring30 === 0) return;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">📊 Daily Document Summary</h1>
        <p style="margin: 5px 0 0; opacity: 0.8;">${now.toLocaleDateString('en-IN')}</p>
      </div>

      <div style="padding: 30px; background: #f8f9fa;">
        <div style="display: flex; gap: 15px; margin-bottom: 20px;">
          ${expired > 0 ? `
          <div style="flex: 1; background: #dc2626; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold;">${expired}</div>
            <div style="font-size: 12px; opacity: 0.9;">EXPIRED</div>
          </div>
          ` : ''}

          ${expiring7 > 0 ? `
          <div style="flex: 1; background: #f59e0b; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold;">${expiring7}</div>
            <div style="font-size: 12px; opacity: 0.9;">EXPIRING IN 7 DAYS</div>
          </div>
          ` : ''}

          ${expiring30 > 0 ? `
          <div style="flex: 1; background: #3b82f6; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold;">${expiring30}</div>
            <div style="font-size: 12px; opacity: 0.9;">EXPIRING IN 30 DAYS</div>
          </div>
          ` : ''}
        </div>

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/documents" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View All Documents
          </a>
        </div>
      </div>
    </div>
  `;

  await sendEmailNotification({
    to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
    subject: `📊 Daily Document Summary - ${expired} Expired, ${expiring7} Expiring Soon`,
    html,
  });
}