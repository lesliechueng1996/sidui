import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'token_storage.g.dart';

const _tokenKey = 'sidui_cookie_token';

class TokenStorage {
  final refreshListenable = ValueNotifier<int>(0);
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    mOptions: MacOsOptions(usesDataProtectionKeychain: false),
  );
  String? _token;

  void dispose() {
    refreshListenable.dispose();
  }

  Future<String?> getToken() async {
    if (_token != null) {
      return _token;
    }
    _token = await _storage.read(key: _tokenKey);
    return _token;
  }

  Future<void> saveToken(String token) async {
    if (token == _token) {
      return;
    }
    await _storage.write(key: _tokenKey, value: token);
    _token = token;
    refreshListenable.value++;
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
    _token = null;
    refreshListenable.value++;
  }
}

@Riverpod(keepAlive: true)
TokenStorage tokenStorage(Ref ref) {
  final storage = TokenStorage();
  ref.onDispose(storage.dispose);
  return storage;
}
