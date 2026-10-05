import 'package:cook_app/data/services/dio_app_error.dart';
import 'package:cook_app/domain/app_error.dart';
import 'package:cook_app/utils/logger.dart';
import 'package:dio/dio.dart';

import '../model/auth/get_session.dart';
import '../model/auth/sign_in_email.dart';

class AuthService {
  AuthService({required this._dio});

  final Dio _dio;

  Future<SignInEmailResponse> signInEmail(SignInEmailRequest request) async {
    try {
      final response = await _dio.post(
        '/api/auth/sign-in/email',
        data: request.toJson(),
      );
      return SignInEmailResponse.fromJson(response.data);
    } on DioException catch (e, stackTrace) {
      talker.error('Error signing in email', e, stackTrace);
      throw appErrorFromDio(e, unauthorizedMessage: '邮箱或密码不正确');
    }
  }

  Future<GetSessionResponse> getSession() async {
    try {
      final response = await _dio.get('/api/auth/get-session');
      final data = response.data;
      if (data == null) {
        throw const UnauthorizedError();
      }
      return GetSessionResponse.fromJson(
        Map<String, dynamic>.from(data as Map),
      );
    } on DioException catch (e, stackTrace) {
      talker.error('Error fetching session', e, stackTrace);
      throw appErrorFromDio(e);
    }
  }
}
