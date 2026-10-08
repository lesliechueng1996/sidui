import 'package:json_annotation/json_annotation.dart';

part 'user_spaces.g.dart';

@JsonSerializable()
class UserSpacesResponse {
  final String code;
  final String message;
  final UserSpacesData? data;

  UserSpacesResponse({
    required this.code,
    required this.message,
    required this.data,
  });

  factory UserSpacesResponse.fromJson(Map<String, dynamic> json) =>
      _$UserSpacesResponseFromJson(json);

  Map<String, dynamic> toJson() => _$UserSpacesResponseToJson(this);
}

@JsonSerializable()
class UserSpacesData {
  final String userId;
  final List<UserSpaceItem> spaces;

  UserSpacesData({required this.userId, required this.spaces});

  factory UserSpacesData.fromJson(Map<String, dynamic> json) =>
      _$UserSpacesDataFromJson(json);

  Map<String, dynamic> toJson() => _$UserSpacesDataToJson(this);
}

@JsonSerializable()
class UserSpaceItem {
  final String spaceId;
  final String role;
  final String joinedAt;
  final String type;
  final String name;
  final bool isActive;

  UserSpaceItem({
    required this.spaceId,
    required this.role,
    required this.joinedAt,
    required this.type,
    required this.name,
    required this.isActive,
  });

  factory UserSpaceItem.fromJson(Map<String, dynamic> json) =>
      _$UserSpaceItemFromJson(json);

  Map<String, dynamic> toJson() => _$UserSpaceItemToJson(this);
}
