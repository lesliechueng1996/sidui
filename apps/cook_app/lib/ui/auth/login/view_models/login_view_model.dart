import 'package:cook_app/data/repositories/auth_repository.dart';
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
    required this.signInState,
    required this._ref,
  });

  static final signInMutation = Mutation<void>();

  final AuthRepository _authRepository;
  final MutationState<void> signInState;
  final Ref _ref;

  void signIn(String email, String password) {
    // `run` records MutationError and rethrows. The form renders that state.
    signInMutation
        .run(_ref, (_) async {
          await _authRepository.signInEmail(email, password);
        })
        .ignore();
  }
}
