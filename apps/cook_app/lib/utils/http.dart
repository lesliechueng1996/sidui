import 'dart:convert';

import 'package:cook_app/config/app_config.dart';
import 'package:cook_app/domain/app_error.dart';
import 'package:cook_app/utils/logger.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:talker_dio_logger/talker_dio_logger_interceptor.dart';
import 'package:talker_dio_logger/talker_dio_logger_settings.dart';

import '../data/services/token_storage.dart';

part 'http.g.dart';

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
          DioException(
            requestOptions: options,
            type: DioExceptionType.cancel,
            error: const UnauthorizedError(),
          ),
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

Dio initDio(TokenStorage storage) {
  final client = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ),
  );

  client.interceptors.add(
    TalkerDioLogger(
      settings: TalkerDioLoggerSettings(
        printRequestHeaders: true,
        printRequestData: false,
        printResponseHeaders: true,
        printResponseMessage: true,
        hiddenHeaders: const {'authorization', 'set-auth-token'},
        responseDataConverter: _redactResponseData,
      ),
    ),
  );
  client.interceptors.add(DioInterceptor(tokenStorage: storage));
  return client;
}

@Riverpod(keepAlive: true)
Dio dio(Ref ref) {
  final client = initDio(ref.watch(tokenStorageProvider));
  ref.onDispose(client.close);
  return client;
}

String _redactResponseData(Response<dynamic> response) {
  try {
    return const JsonEncoder.withIndent('  ')
        .convert(_redactTokens(response.data));
  } catch (_) {
    return '${response.data}';
  }
}

Object? _redactTokens(Object? value) {
  if (value is Map) {
    return <String, Object?>{
      for (final entry in value.entries)
        entry.key.toString(): entry.key == 'token'
            ? '***'
            : _redactTokens(entry.value),
    };
  }
  if (value is List) {
    return <Object?>[for (final item in value) _redactTokens(item)];
  }
  return value;
}
