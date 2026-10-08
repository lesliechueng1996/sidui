import 'package:cook_app/data/repositories/auth_repository.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'no_space_view_model.g.dart';

@riverpod
NoSpaceViewModel noSpaceViewModel(Ref ref) {
  return NoSpaceViewModel(authRepository: ref.watch(authRepositoryProvider));
}

class NoSpaceViewModel {
  NoSpaceViewModel({required this._authRepository});

  final AuthRepository _authRepository;

  Future<void> signOut() {
    return _authRepository.signOut();
  }
}
