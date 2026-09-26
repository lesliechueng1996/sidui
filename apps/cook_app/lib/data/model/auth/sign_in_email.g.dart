// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sign_in_email.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SignInEmailRequest _$SignInEmailRequestFromJson(Map<String, dynamic> json) =>
    SignInEmailRequest(
      email: json['email'] as String,
      password: json['password'] as String,
      callbackURL: json['callbackURL'] as String? ?? '',
      rememberMe: json['rememberMe'] as bool? ?? true,
    );

Map<String, dynamic> _$SignInEmailRequestToJson(SignInEmailRequest instance) =>
    <String, dynamic>{
      'email': instance.email,
      'password': instance.password,
      'callbackURL': instance.callbackURL,
      'rememberMe': instance.rememberMe,
    };

SignInEmailResponseUser _$SignInEmailResponseUserFromJson(
  Map<String, dynamic> json,
) => SignInEmailResponseUser(
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

Map<String, dynamic> _$SignInEmailResponseUserToJson(
  SignInEmailResponseUser instance,
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

SignInEmailResponse _$SignInEmailResponseFromJson(Map<String, dynamic> json) =>
    SignInEmailResponse(
      redirect: json['redirect'] as bool,
      token: json['token'] as String,
      url: json['url'] as String?,
      user: SignInEmailResponseUser.fromJson(
        json['user'] as Map<String, dynamic>,
      ),
    );

Map<String, dynamic> _$SignInEmailResponseToJson(
  SignInEmailResponse instance,
) => <String, dynamic>{
  'redirect': instance.redirect,
  'token': instance.token,
  'url': instance.url,
  'user': instance.user,
};
