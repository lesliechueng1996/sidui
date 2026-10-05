import 'dart:convert';

import 'package:cook_app/domain/model/user.dart';
import 'package:cook_app/utils/logger.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _userKey = 'sidui_cook_user';
const _userCacheTimeout = Duration(days: 1);

class UserStorage {
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    mOptions: MacOsOptions(usesDataProtectionKeychain: false),
  );

  Future<User?> getUser() async {
    try {
      final raw = await _storage.read(key: _userKey);
      if (raw == null) {
        return null;
      }
      final stored = jsonDecode(raw);
      if (stored is! Map) {
        talker.error('Invalid user cache format');
        await clearUser();
        return null;
      }
      final cachedAtMs = stored['cachedAt'];
      final userJson = stored['user'];
      if (cachedAtMs is! int || userJson is! Map) {
        talker.error('Invalid user cache format');
        await clearUser();
        return null;
      }
      final cachedAt = DateTime.fromMillisecondsSinceEpoch(cachedAtMs);
      if (cachedAt.isBefore(DateTime.now().subtract(_userCacheTimeout))) {
        talker.info('User cache expired, clearing user');
        await clearUser();
        return null;
      }
      return User.fromJson(Map<String, dynamic>.from(userJson));
    } catch (e, stackTrace) {
      talker.error('Invalid user cache', e, stackTrace);
      await clearUser();
      return null;
    }
  }

  Future<void> saveUser(User user) async {
    await _storage.write(
      key: _userKey,
      value: jsonEncode({
        'user': user.toJson(),
        'cachedAt': DateTime.now().millisecondsSinceEpoch,
      }),
    );
  }

  Future<void> clearUser() async {
    await _storage.delete(key: _userKey);
  }
}
