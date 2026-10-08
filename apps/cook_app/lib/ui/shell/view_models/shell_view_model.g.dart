// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'shell_view_model.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(ShellViewModel)
final shellViewModelProvider = ShellViewModelProvider._();

final class ShellViewModelProvider
    extends $AsyncNotifierProvider<ShellViewModel, ShellData> {
  ShellViewModelProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'shellViewModelProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$shellViewModelHash();

  @$internal
  @override
  ShellViewModel create() => ShellViewModel();
}

String _$shellViewModelHash() => r'4c24a98a7ae7bf22d81b705d884833f37c7648f8';

abstract class _$ShellViewModel extends $AsyncNotifier<ShellData> {
  FutureOr<ShellData> build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<AsyncValue<ShellData>, ShellData>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<ShellData>, ShellData>,
              AsyncValue<ShellData>,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
