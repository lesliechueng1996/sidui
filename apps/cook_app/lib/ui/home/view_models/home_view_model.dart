import 'package:cook_app/data/repositories/cook_space_repository.dart';
import 'package:cook_app/domain/app_error.dart';
import 'package:cook_app/domain/model/cook_space.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'home_view_model.g.dart';

@riverpod
class HomeViewModel extends _$HomeViewModel {
  @override
  Future<List<CookSpace>> build() {
    return ref.watch(cookSpaceRepositoryProvider).listMine();
  }

  String messageOf(Object error) {
    return error is AppError ? error.message : const ServerError().message;
  }

  void retry() {
    ref.invalidateSelf();
  }
}
