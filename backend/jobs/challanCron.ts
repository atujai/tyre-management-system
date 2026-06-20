import cron from 'node-cron';
import { ChallanService } from '../services/challanService.js';

const service = new ChallanService();

// Only start cron in production or if explicitly enabled
const enableCron = process.env.ENABLE_CHALLAN_CRON === 'true' || process.env.NODE_ENV === 'production';

if (enableCron) {
  // Daily at 6:00 AM IST
  cron.schedule('0 6 * * *', async () => {
    console.log('[CRON] Starting daily challan check...', new Date().toISOString());

    try {
      const result = await service.checkAllVehicles();
      console.log(`[CRON] Checked: ${result.checked}, New: ${result.newChallans}, Updated: ${result.updated}`);

      if (result.errors.length > 0) {
        console.error('[CRON] Errors:', result.errors);
      }
    } catch (error: any) {
      console.error('[CRON] Fatal error:', error);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('[CRON] Challan checker scheduled for 6:00 AM IST daily');
} else {
  console.log('[CRON] Challan checker disabled. Set ENABLE_CHALLAN_CRON=true to enable.');
}