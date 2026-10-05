// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'get_session.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

GetSessionResponseSession _$GetSessionResponseSessionFromJson(
  Map<String, dynamic> json,
) => GetSessionResponseSession(
  id: json['id'] as String,
  userId: json['userId'] as String,
  impersonatedBy: json['impersonatedBy'] as String?,
  ipAddress: json['ipAddress'] as String?,
  userAgent: json['userAgent'] as String?,
  createdAt: json['createdAt'] as String,
  updatedAt: json['updatedAt'] as String,
  expiresAt: json['expiresAt'] as String,
);

Map<String, dynamic> _$GetSessionResponseSessionToJson(
  GetSessionResponseSession instance,
) => <String, dynamic>{
  'id': instance.id,
  'userId': instance.userId,
  'impersonatedBy': instance.impersonatedBy,
  'ipAddress': instance.ipAddress,
  'userAgent': instance.userAgent,
  'createdAt': instance.createdAt,
  'updatedAt': instance.updatedAt,
  'expiresAt': instance.expiresAt,
};

GetSessionResponseUser _$GetSessionResponseUserFromJson(
  Map<String, dynamic> json,
) => GetSessionResponseUser(
  id: json['id'] as String,
  name: json['name'] as String,
  email: json['email'] as String,
  emailVerified: json['emailVerified'] as bool,
  banExpires: json['banExpires'] as String?,
  banned: json['banned'] as bool?,
  bannedReason: json['bannedReason'] as String?,
  image: json['image'] as String?,
  role: json['role'] as String?,
  createdAt: json['createdAt'] as String,
  updatedAt: json['updatedAt'] as String,
);

Map<String, dynamic> _$GetSessionResponseUserToJson(
  GetSessionResponseUser instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'email': instance.email,
  'emailVerified': instance.emailVerified,
  'banExpires': instance.banExpires,
  'banned': instance.banned,
  'bannedReason': instance.bannedReason,
  'image': instance.image,
  'role': instance.role,
  'createdAt': instance.createdAt,
  'updatedAt': instance.updatedAt,
};

GetSessionResponse _$GetSessionResponseFromJson(Map<String, dynamic> json) =>
    GetSessionResponse(
      session: GetSessionResponseSession.fromJson(
        json['session'] as Map<String, dynamic>,
      ),
      user: GetSessionResponseUser.fromJson(
        json['user'] as Map<String, dynamic>,
      ),
    );

Map<String, dynamic> _$GetSessionResponseToJson(GetSessionResponse instance) =>
    <String, dynamic>{'session': instance.session, 'user': instance.user};
