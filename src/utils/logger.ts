/**
 * 统一前端日志工具
 * 自动添加时间戳和级别前缀，并支持在生产环境下过滤某些级别的日志
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDev = import.meta.env.DEV;

  private formatMessage(level: LogLevel, message: string): string {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return `[${now}] [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, ...args: any[]) {
    if (this.isDev) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]) {
    console.info(this.formatMessage('info', message), ...args);
  }

  warn(message: string, ...args: any[]) {
    console.warn(this.formatMessage('warn', message), ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(this.formatMessage('error', message), ...args);
  }
}

export const logger = new Logger();
