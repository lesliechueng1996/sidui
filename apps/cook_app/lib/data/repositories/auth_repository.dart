import 'package:cook_app/domain/model/user.dart';
import 'package:cook_app/utils/http.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../model/auth/sign_in_email.dart';
import '../services/auth_service.dart';

part 'auth_repository.g.dart';

@riverpod
AuthRepository authRepository(Ref ref) {
  return AuthRepository(authService: AuthService(dio: ref.watch(dioProvider)));
}

class AuthRepository {
  AuthRepository({required this._authService});

  final AuthService _authService;

  Future<User> signInEmail(String email, String password) async {
    final request = SignInEmailRequest(email: email, password: password);
    final response = await _authService.signInEmail(request);
    final user = response.user;
    return User(
      id: user.id,
      name: user.name,
      email: user.email,
      banned: user.banned ?? false,
      image: user.image,
      role: user.role,
    );
  }
}
