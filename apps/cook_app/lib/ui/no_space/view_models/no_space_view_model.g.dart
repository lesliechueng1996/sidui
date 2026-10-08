// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'no_space_view_model.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(noSpaceViewModel)
final noSpaceViewModelProvider = NoSpaceViewModelProvider._();

final class NoSpaceViewModelProvider
    extends
        $FunctionalProvider<
          NoSpaceViewModel,
          NoSpaceViewModel,
          NoSpaceViewModel
        >
    with $Provider<NoSpaceViewModel> {
  NoSpaceViewModelProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'noSpaceViewModelProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$noSpaceViewModelHash();

  @$internal
  @override
  $ProviderElement<NoSpaceViewModel> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  NoSpaceViewModel create(Ref ref) {
    return noSpaceViewModel(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(NoSpaceViewModel value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<NoSpaceViewModel>(value),
    );
  }
}

String _$noSpaceViewModelHash() => r'dbbbe3bba9b559f4ff9a6fa1a4b0640bb309585a';
