// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'settings_view_model.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(settingsViewModel)
final settingsViewModelProvider = SettingsViewModelProvider._();

final class SettingsViewModelProvider
    extends
        $FunctionalProvider<
          SettingsViewModel,
          SettingsViewModel,
          SettingsViewModel
        >
    with $Provider<SettingsViewModel> {
  SettingsViewModelProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'settingsViewModelProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$settingsViewModelHash();

  @$internal
  @override
  $ProviderElement<SettingsViewModel> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  SettingsViewModel create(Ref ref) {
    return settingsViewModel(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(SettingsViewModel value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<SettingsViewModel>(value),
    );
  }
}

String _$settingsViewModelHash() => r'acd9b96fd14ce8dcdf146ec56119a183e2166eb1';
