import 'package:cook_app/config/app_config.dart';
import 'package:cook_app/utils/logger.dart';
import 'package:dio/dio.dart';
import 'package:talker_dio_logger/talker_dio_logger_interceptor.dart';
import 'package:talker_dio_logger/talker_dio_logger_settings.dart';

import '../data/services/token_storage.dart';

const _bearerResponseTokenHeader = 'set-auth-token';

class DioInterceptor extends QueuedInterceptor {
  final TokenStorage _tokenStorage;

  DioInterceptor({required this._tokenStorage});

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final url = options.uri.toString();
    if (!url.endsWith('/api/auth/sign-in/email')) {
      final token = await _tokenStorage.getToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      } else {
        talker.warning('No token found');
        await _tokenStorage.deleteToken();
        handler.reject(
          DioException(requestOptions: options, type: DioExceptionType.cancel),
        );
        return;
      }
    }
    super.onRequest(options, handler);
  }

  @override
  void onResponse(
    Response<dynamic> response,
    ResponseInterceptorHandler handler,
  ) async {
    final bearerToken = response.headers.value(_bearerResponseTokenHeader);
    if (bearerToken != null && bearerToken.isNotEmpty) {
      await _tokenStorage.saveToken(bearerToken);
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      await _tokenStorage.deleteToken();
      handler.reject(err);
      return;
    }
    super.onError(err, handler);
  }
}

Dio initDio() {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ),
  );

  dio.interceptors.add(
    TalkerDioLogger(
      settings: const TalkerDioLoggerSettings(
        printRequestHeaders: true,
        printResponseHeaders: true,
        printResponseMessage: true,
      ),
    ),
  );
  dio.interceptors.add(DioInterceptor(tokenStorage: tokenStorage));
  return dio;
}

final dio = initDio();
