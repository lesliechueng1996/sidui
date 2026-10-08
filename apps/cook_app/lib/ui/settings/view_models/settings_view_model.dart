import 'package:cook_app/data/repositories/auth_repository.dart';
import 'package:cook_app/domain/app_error.dart';
import 'package:hooks_riverpod/experimental/mutation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'settings_view_model.g.dart';

@riverpod
SettingsViewModel settingsViewModel(Ref ref) {
  return SettingsViewModel(
    authRepository: ref.watch(authRepositoryProvider),
    signOutState: ref.watch(SettingsViewModel.signOutMutation),
    ref: ref,
  );
}

class SettingsViewModel {
  SettingsViewModel({
    required this._authRepository,
    required this._signOutState,
    required this._ref,
  });

  static final signOutMutation = Mutation<void>();

  final AuthRepository _authRepository;
  final MutationState<void> _signOutState;
  final Ref _ref;

  bool get isSigningOut => _signOutState.isPending;

  String? get errorMessage {
    final state = _signOutState;
    if (state is! MutationError) {
      return null;
    }
    final error = state.error;
    return error is AppError ? error.message : const ServerError().message;
  }

  void signOut() {
    // `run` records MutationError and rethrows. errorMessage reads that state.
    signOutMutation.run(_ref, (_) async {
      await _authRepository.signOut();
    }).ignore();
  }
}
