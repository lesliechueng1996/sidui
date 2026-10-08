// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'cook_space_repository.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(cookSpaceRepository)
final cookSpaceRepositoryProvider = CookSpaceRepositoryProvider._();

final class CookSpaceRepositoryProvider
    extends
        $FunctionalProvider<
          CookSpaceRepository,
          CookSpaceRepository,
          CookSpaceRepository
        >
    with $Provider<CookSpaceRepository> {
  CookSpaceRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'cookSpaceRepositoryProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$cookSpaceRepositoryHash();

  @$internal
  @override
  $ProviderElement<CookSpaceRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  CookSpaceRepository create(Ref ref) {
    return cookSpaceRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(CookSpaceRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<CookSpaceRepository>(value),
    );
  }
}

String _$cookSpaceRepositoryHash() =>
    r'bc5b843811c1ece9cb67708715e9fcb73d772251';
