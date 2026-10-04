// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'login_view_model.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(loginViewModel)
final loginViewModelProvider = LoginViewModelProvider._();

final class LoginViewModelProvider
    extends $FunctionalProvider<LoginViewModel, LoginViewModel, LoginViewModel>
    with $Provider<LoginViewModel> {
  LoginViewModelProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'loginViewModelProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$loginViewModelHash();

  @$internal
  @override
  $ProviderElement<LoginViewModel> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  LoginViewModel create(Ref ref) {
    return loginViewModel(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(LoginViewModel value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<LoginViewModel>(value),
    );
  }
}

String _$loginViewModelHash() => r'762f13c53dd181421d2501d95a38bc643ef50faa';
