/// Failure thrown by repositories for the UI to handle.
sealed class AppError implements Exception {
  const AppError(this.message);

  final String message;

  @override
  String toString() => message;
}

final class NetworkError extends AppError {
  const NetworkError([super.message = '网络不可用']);
}

final class UnauthorizedError extends AppError {
  const UnauthorizedError([super.message = '登录已过期，请重新登录']);
}

final class ServerError extends AppError {
  const ServerError([super.message = '服务暂时不可用']);
}
