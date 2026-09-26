import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';

@freezed
class User with _$User {
  final String id;
  final String name;
  final String email;
  final bool banned;
  final String? image;
  final String? role;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.banned,
    this.image,
    this.role,
  });
}
