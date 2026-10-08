import 'package:cook_app/data/model/cook/user_spaces.dart';
import 'package:cook_app/data/services/dio_app_error.dart';
import 'package:cook_app/domain/app_error.dart';
import 'package:cook_app/utils/logger.dart';
import 'package:dio/dio.dart';

const _successCode = 'SUCCESS';

class CookUserService {
  CookUserService({required this._dio});

  final Dio _dio;

  Future<UserSpacesData> listSpaces(String userId) async {
    try {
      final response = await _dio.get('/api/v1/cook/user/$userId/spaces');
      final body = response.data;
      if (body is! Map) {
        throw const ServerError();
      }
      final parsed = UserSpacesResponse.fromJson(
        Map<String, dynamic>.from(body),
      );
      final data = parsed.data;
      if (parsed.code != _successCode || data == null) {
        throw const ServerError();
      }
      return data;
    } on DioException catch (e, stackTrace) {
      talker.error('Error listing cook user spaces', e, stackTrace);
      throw appErrorFromDio(e);
    } on AppError {
      rethrow;
    } catch (e, stackTrace) {
      talker.error('Error listing cook user spaces', e, stackTrace);
      throw const ServerError();
    }
  }
}
