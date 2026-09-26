import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _tokenKey = 'sidui_cookie_token';

class TokenStorage extends ChangeNotifier {
  final FlutterSecureStorage _storage = const FlutterSecureStorage(
    mOptions: MacOsOptions(usesDataProtectionKeychain: false),
  );
  String? _token;

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
    notifyListeners();
  }

  Future<void> deleteToken() async {
    await _storage.delete(key: _tokenKey);
    _token = null;
    notifyListeners();
  }
}

final tokenStorage = TokenStorage();
