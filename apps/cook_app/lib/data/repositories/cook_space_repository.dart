import 'package:cook_app/data/repositories/auth_repository.dart';
import 'package:cook_app/data/services/cook_user_service.dart';
import 'package:cook_app/domain/app_error.dart';
import 'package:cook_app/domain/model/cook_space.dart';
import 'package:cook_app/utils/http.dart';
import 'package:cook_app/utils/logger.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'cook_space_repository.g.dart';

@riverpod
CookSpaceRepository cookSpaceRepository(Ref ref) {
  return CookSpaceRepository(
    cookUserService: CookUserService(dio: ref.watch(dioProvider)),
    authRepository: ref.watch(authRepositoryProvider),
  );
}

class CookSpaceRepository {
  CookSpaceRepository({
    required this._cookUserService,
    required this._authRepository,
  });

  final CookUserService _cookUserService;
  final AuthRepository _authRepository;

  Future<List<CookSpace>> listMine() async {
    try {
      final user = await _authRepository.currentUser();
      final data = await _cookUserService.listSpaces(user.id);
      return [
        for (final space in data.spaces)
          CookSpace(
            spaceId: space.spaceId,
            role: space.role,
            joinedAt: space.joinedAt,
            type: space.type,
            name: space.name,
            isActive: space.isActive,
          ),
      ];
    } on AppError {
      rethrow;
    } catch (e, stackTrace) {
      talker.error('Error listing cook spaces', e, stackTrace);
      throw const ServerError();
    }
  }
}
