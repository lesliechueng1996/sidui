import 'package:dio/dio.dart';

import '../model/auth/sign_in_email.dart';

class AuthService {
  AuthService({required this._dio});

  final Dio _dio;

  Future<SignInEmailResponse> signInEmail(SignInEmailRequest request) async {
    final response = await _dio.post(
      '/api/auth/sign-in/email',
      data: request.toJson(),
    );
    return SignInEmailResponse.fromJson(response.data);
  }
}
