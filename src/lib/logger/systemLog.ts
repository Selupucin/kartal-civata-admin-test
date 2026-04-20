import dbConnect from '@shared/lib/db/mongoose';
import SystemLog from '@shared/models/SystemLog';
import Notification from '@shared/models/Notification';
import User from '@shared/models/User';

interface LogErrorOptions {
  level?: 'info' | 'warn' | 'error' | 'fatal';
  source?: 'site' | 'admin' | 'api' | 'system';
  message: string;
  details?: string;
  stack?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  userId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function logSystemError(options: LogErrorOptions): Promise<void> {
  try {
    await dbConnect();

    const {
      level = 'error',
      source = 'system',
      message,
      details,
      stack,
      path,
      method,
      statusCode,
      userId,
      ip,
      userAgent,
      metadata,
    } = options;

    // Save to SystemLog
    await SystemLog.create({
      level,
      source,
      message,
      details,
      stack,
      path,
      method,
      statusCode,
      userId,
      ip,
      userAgent,
      metadata,
    });

    // If error or fatal, notify admins who have system notifications enabled
    if (level === 'error' || level === 'fatal') {
      const admins = await User.find({
        role: 'admin',
        'preferences.adminNotifications.system': true,
      }).select('_id');

      if (admins.length > 0) {
        const levelLabel = level === 'fatal' ? 'KRİTİK HATA' : 'HATA';
        const notifications = admins.map((admin) => ({
          userId: admin._id,
          type: 'system' as const,
          title: `${levelLabel}: ${source.toUpperCase()}`,
          message: message.length > 200 ? message.slice(0, 200) + '...' : message,
          data: {
            logLevel: level,
            source,
            path: path || '',
            statusCode: statusCode || 0,
          },
          isRead: false,
        }));

        await Notification.insertMany(notifications);
      }
    }
  } catch (err) {
    // Avoid infinite loop - just console.error
    console.error('[logSystemError] Failed to log:', err);
  }
}
