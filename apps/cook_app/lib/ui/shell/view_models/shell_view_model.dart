import 'package:cook_app/data/repositories/auth_repository.dart';
import 'package:cook_app/data/repositories/cook_space_repository.dart';
import 'package:cook_app/domain/app_error.dart';
import 'package:cook_app/domain/model/cook_space.dart';
import 'package:cook_app/domain/model/user.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'shell_view_model.g.dart';

class ShellData {
  const ShellData({required this.spaces, required this.user});

  final List<CookSpace> spaces;
  final User user;

  CookSpace get activeSpace {
    return spaces.firstWhere(
      (space) => space.isActive,
      orElse: () => spaces.first,
    );
  }
}

@riverpod
class ShellViewModel extends _$ShellViewModel {
  @override
  Future<ShellData> build() async {
    final spaces = await ref.watch(cookSpaceRepositoryProvider).listMine();
    final user = await ref.watch(authRepositoryProvider).currentUser();
    return ShellData(spaces: spaces, user: user);
  }

  String messageOf(Object error) {
    return error is AppError ? error.message : const ServerError().message;
  }

  void retry() {
    ref.invalidateSelf();
  }
}
