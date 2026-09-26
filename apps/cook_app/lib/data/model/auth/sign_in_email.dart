import 'package:json_annotation/json_annotation.dart';

part 'sign_in_email.g.dart';

@JsonSerializable()
class SignInEmailRequest {
  final String email;
  final String password;
  final String callbackURL;
  final bool rememberMe;

  SignInEmailRequest({
    required this.email,
    required this.password,
    this.callbackURL = '',
    this.rememberMe = true,
  });

  factory SignInEmailRequest.fromJson(Map<String, dynamic> json) =>
      _$SignInEmailRequestFromJson(json);

  Map<String, dynamic> toJson() => _$SignInEmailRequestToJson(this);
}

@JsonSerializable()
class SignInEmailResponseUser {
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

  SignInEmailResponseUser({
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

  factory SignInEmailResponseUser.fromJson(Map<String, dynamic> json) =>
      _$SignInEmailResponseUserFromJson(json);

  Map<String, dynamic> toJson() => _$SignInEmailResponseUserToJson(this);
}

@JsonSerializable()
class SignInEmailResponse {
  final bool redirect;
  final String token;
  final String? url;
  final SignInEmailResponseUser user;

  SignInEmailResponse({
    required this.redirect,
    required this.token,
    this.url,
    required this.user,
  });

  factory SignInEmailResponse.fromJson(Map<String, dynamic> json) =>
      _$SignInEmailResponseFromJson(json);

  Map<String, dynamic> toJson() => _$SignInEmailResponseToJson(this);
}
