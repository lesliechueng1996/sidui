abstract final class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3001',
  );
  static const logEnabled = bool.fromEnvironment(
    'LOG_ENABLED',
    defaultValue: true,
  );
  static const logConsoleEnabled = bool.fromEnvironment(
    'LOG_CONSOLE_ENABLED',
    defaultValue: true,
  );
}
