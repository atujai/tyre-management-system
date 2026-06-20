import { PrismaClient } from '@prisma/client';
import { differenceInDays } from 'date-fns';
import { sendDocumentExpiryReminder, sendDailySummary } from '../services/emailService';

const prisma = new PrismaClient();

export async function checkAndSendReminders() {
  const now = new Date();

  const documents = await prisma.document.findMany({
    where: {
      expiryDate: { not: null },
      status: { not: 'ARCHIVED' },
    },
    include: {
      truck: { select: { id: true, number: true, model: true } },
    },
  });

  for (const doc of documents) {
    if (!doc.expiryDate) continue;

    const daysUntil = differenceInDays(doc.expiryDate, now);

    const thresholds = [
      { days: 30, sent: doc.reminderSent30, field: 'reminderSent30' as const },
      { days: 15, sent: doc.reminderSent15, field: 'reminderSent15' as const },
      { days: 7, sent: doc.reminderSent7, field: 'reminderSent7' as const },
      { days: 1, sent: doc.reminderSent1, field: 'reminderSent1' as const },
    ];

    for (const threshold of thresholds) {
      if (daysUntil <= threshold.days && daysUntil > 0 && !threshold.sent) {
        // Create reminder record
        await prisma.documentReminder.create({
          data: {
            documentId: doc.id,
            type: `EXPIRY_${threshold.days}_DAYS` as any,
            daysBefore: daysUntil,
            message: `URGENT: ${doc.title} for truck ${doc.truck.number} expires in ${daysUntil} days (${doc.expiryDate!.toDateString()})`,
          },
        });

        // Mark reminder as sent
        await prisma.document.update({
          where: { id: doc.id },
          data: { [threshold.field]: true },
        });

        // Send email notification
        try {
          await sendDocumentExpiryReminder(doc.id, daysUntil);
          console.log(`Email reminder sent: ${doc.title} - ${daysUntil} days remaining`);
        } catch (error) {
          console.error(`Failed to send email for ${doc.title}:`, error);
        }
      }
    }

    // Update status if expired
    if (daysUntil < 0 && doc.status !== 'EXPIRED') {
      await prisma.document.update({
        where: { id: doc.id },
        data: { status: 'EXPIRED' },
      });

      // Send expired notification
      try {
        await sendDocumentExpiryReminder(doc.id, daysUntil);
      } catch (error) {
        console.error(`Failed to send expiry notification for ${doc.title}:`, error);
      }
    }
  }
}

export async function sendDailyDocumentSummary() {
  try {
    await sendDailySummary();
    console.log('Daily summary email sent successfully');
  } catch (error) {
    console.error('Failed to send daily summary:', error);
  }
}