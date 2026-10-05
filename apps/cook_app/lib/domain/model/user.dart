import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.dart';

@freezed
@JsonSerializable()
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

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);

  Map<String, dynamic> toJson() => _$UserToJson(this);
}
