export type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'network';

export const getLevelColor = (level: LogLevel) => {
  switch (level) {
    case 'info':
      return '#00bcd4';
    case 'warn':
      return '#ffc107';
    case 'error':
      return '#f44336';
    case 'success':
      return '#4caf50';
    case 'network':
      return '#9c27b0';
    default:
      return '#ffffff';
  }
};

export const getLevelIcon = (level: LogLevel) => {
  switch (level) {
    case 'info':
      return 'ℹ️';
    case 'warn':
      return '⚠️';
    case 'error':
      return '❌';
    case 'success':
      return '✅';
    case 'network':
      return '🌐';
    default:
      return '•';
  }
};
