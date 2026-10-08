// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_spaces.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserSpacesResponse _$UserSpacesResponseFromJson(Map<String, dynamic> json) =>
    UserSpacesResponse(
      code: json['code'] as String,
      message: json['message'] as String,
      data: json['data'] == null
          ? null
          : UserSpacesData.fromJson(json['data'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$UserSpacesResponseToJson(UserSpacesResponse instance) =>
    <String, dynamic>{
      'code': instance.code,
      'message': instance.message,
      'data': instance.data,
    };

UserSpacesData _$UserSpacesDataFromJson(Map<String, dynamic> json) =>
    UserSpacesData(
      userId: json['userId'] as String,
      spaces: (json['spaces'] as List<dynamic>)
          .map((e) => UserSpaceItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$UserSpacesDataToJson(UserSpacesData instance) =>
    <String, dynamic>{'userId': instance.userId, 'spaces': instance.spaces};

UserSpaceItem _$UserSpaceItemFromJson(Map<String, dynamic> json) =>
    UserSpaceItem(
      spaceId: json['spaceId'] as String,
      role: json['role'] as String,
      joinedAt: json['joinedAt'] as String,
      type: json['type'] as String,
      name: json['name'] as String,
      isActive: json['isActive'] as bool,
    );

Map<String, dynamic> _$UserSpaceItemToJson(UserSpaceItem instance) =>
    <String, dynamic>{
      'spaceId': instance.spaceId,
      'role': instance.role,
      'joinedAt': instance.joinedAt,
      'type': instance.type,
      'name': instance.name,
      'isActive': instance.isActive,
    };
