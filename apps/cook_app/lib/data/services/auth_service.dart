import 'package:cook_app/utils/http.dart';

import '../model/auth/sign_in_email.dart';

class AuthService {
  Future<SignInEmailResponse> signInEmail(SignInEmailRequest request) async {
    final response = await dio.post(
      '/api/auth/sign-in/email',
      data: request.toJson(),
    );
    return SignInEmailResponse.fromJson(response.data);
  }
}
