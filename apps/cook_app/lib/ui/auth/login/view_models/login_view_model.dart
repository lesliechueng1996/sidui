import 'package:cook_app/data/repositories/auth_repository.dart';
import 'package:cook_app/domain/app_error.dart';
import 'package:hooks_riverpod/experimental/mutation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'login_view_model.g.dart';

@riverpod
LoginViewModel loginViewModel(Ref ref) {
  return LoginViewModel(
    authRepository: ref.watch(authRepositoryProvider),
    signInState: ref.watch(LoginViewModel.signInMutation),
    ref: ref,
  );
}

class LoginViewModel {
  LoginViewModel({
    required this._authRepository,
    required this._signInState,
    required this._ref,
  });

  static final signInMutation = Mutation<void>();

  final AuthRepository _authRepository;
  final MutationState<void> _signInState;
  final Ref _ref;

  bool get isSigningIn => _signInState.isPending;

  String? get errorMessage {
    final state = _signInState;
    if (state is! MutationError) {
      return null;
    }
    final error = state.error;
    return error is AppError ? error.message : const ServerError().message;
  }

  void signIn(String email, String password) {
    // `run` records MutationError and rethrows. errorMessage reads that state.
    signInMutation.run(_ref, (_) async {
      await _authRepository.signInEmail(email, password);
    }).ignore();
  }
}
