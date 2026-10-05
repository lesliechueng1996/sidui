import 'package:cook_app/domain/app_error.dart';
import 'package:dio/dio.dart';

AppError appErrorFromDio(DioException error, {String? unauthorizedMessage}) {
  final wrapped = error.error;
  if (wrapped is AppError) {
    return wrapped;
  }
  final statusCode = error.response?.statusCode;
  if (statusCode == 401) {
    return unauthorizedMessage == null
        ? const UnauthorizedError()
        : UnauthorizedError(unauthorizedMessage);
  }
  if (error.type == DioExceptionType.connectionTimeout ||
      error.type == DioExceptionType.connectionError ||
      error.type == DioExceptionType.sendTimeout ||
      error.type == DioExceptionType.receiveTimeout) {
    return const NetworkError();
  }
  return const ServerError();
}
