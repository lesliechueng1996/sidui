import 'package:cook_app/data/services/token_storage.dart';
import 'package:cook_app/data/services/user_storage.dart';
import 'package:cook_app/domain/app_error.dart';
import 'package:cook_app/domain/model/user.dart';
import 'package:cook_app/utils/http.dart';
import 'package:cook_app/utils/logger.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../model/auth/sign_in_email.dart';
import '../services/auth_service.dart';

part 'auth_repository.g.dart';

@riverpod
AuthRepository authRepository(Ref ref) {
  return AuthRepository(
    authService: AuthService(dio: ref.watch(dioProvider)),
    userStorage: UserStorage(),
    tokenStorage: ref.watch(tokenStorageProvider),
  );
}

class AuthRepository {
  AuthRepository({
    required this._authService,
    required this._userStorage,
    required this._tokenStorage,
  });

  final AuthService _authService;
  final UserStorage _userStorage;
  final TokenStorage _tokenStorage;

  Future<User> signInEmail(String email, String password) async {
    try {
      final request = SignInEmailRequest(email: email, password: password);
      final response = await _authService.signInEmail(request);
      final apiUser = response.user;
      final user = _toUser(
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        banned: apiUser.banned,
        image: apiUser.image,
        role: apiUser.role,
      );
      await _userStorage.saveUser(user);
      return user;
    } on AppError {
      rethrow;
    } catch (e, stackTrace) {
      talker.error('Error signing in email', e, stackTrace);
      throw const ServerError();
    }
  }

  /// Cached profile is for display. Do not use [User.banned] or [User.role]
  /// from this cache to authorize actions.
  Future<User> currentUser({bool refresh = false}) async {
    final token = await _tokenStorage.getToken();
    if (token == null) {
      await _userStorage.clearUser();
      throw const UnauthorizedError();
    }
    try {
      if (!refresh) {
        final user = await _userStorage.getUser();
        if (user != null) {
          return user;
        }
      }
      talker.info('Fetching current user from server');
      final session = await _authService.getSession();
      final apiUser = session.user;
      final user = _toUser(
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        banned: apiUser.banned,
        image: apiUser.image,
        role: apiUser.role,
      );
      await _userStorage.saveUser(user);
      return user;
    } on UnauthorizedError {
      await signOut();
      rethrow;
    } on AppError {
      rethrow;
    } catch (e, stackTrace) {
      talker.error('Error fetching current user', e, stackTrace);
      throw const ServerError();
    }
  }

  Future<void> signOut() async {
    await _tokenStorage.deleteToken();
    await _userStorage.clearUser();
  }
}

User _toUser({
  required String id,
  required String name,
  required String email,
  required bool? banned,
  required String? image,
  required String? role,
}) {
  return User(
    id: id,
    name: name,
    email: email,
    banned: banned ?? false,
    image: image,
    role: role,
  );
}
