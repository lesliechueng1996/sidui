import 'package:json_annotation/json_annotation.dart';

part 'get_session.g.dart';

@JsonSerializable()
class GetSessionResponseSession {
  final String id;
  final String userId;
  final String? impersonatedBy;
  final String? ipAddress;
  final String? userAgent;
  final String createdAt;
  final String updatedAt;
  final String expiresAt;

  GetSessionResponseSession({
    required this.id,
    required this.userId,
    this.impersonatedBy,
    this.ipAddress,
    this.userAgent,
    required this.createdAt,
    required this.updatedAt,
    required this.expiresAt,
  });

  factory GetSessionResponseSession.fromJson(Map<String, dynamic> json) =>
      _$GetSessionResponseSessionFromJson(json);

  Map<String, dynamic> toJson() => _$GetSessionResponseSessionToJson(this);
}

@JsonSerializable()
class GetSessionResponseUser {
  final String id;
  final String name;
  final String email;
  final bool emailVerified;
  final String? banExpires;
  final bool? banned;
  final String? bannedReason;
  final String? image;
  final String? role;
  final String createdAt;
  final String updatedAt;

  GetSessionResponseUser({
    required this.id,
    required this.name,
    required this.email,
    required this.emailVerified,
    this.banExpires,
    this.banned,
    this.bannedReason,
    this.image,
    this.role,
    required this.createdAt,
    required this.updatedAt,
  });

  factory GetSessionResponseUser.fromJson(Map<String, dynamic> json) =>
      _$GetSessionResponseUserFromJson(json);

  Map<String, dynamic> toJson() => _$GetSessionResponseUserToJson(this);
}

@JsonSerializable()
class GetSessionResponse {
  final GetSessionResponseSession session;
  final GetSessionResponseUser user;

  GetSessionResponse({required this.session, required this.user});

  factory GetSessionResponse.fromJson(Map<String, dynamic> json) =>
      _$GetSessionResponseFromJson(json);

  Map<String, dynamic> toJson() => _$GetSessionResponseToJson(this);
}
