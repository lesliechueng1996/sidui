enum CookSpaceType {
  personal,
  family;

  static CookSpaceType fromValue(String value) {
    return switch (value) {
      'personal' => CookSpaceType.personal,
      'family' => CookSpaceType.family,
      _ => throw ArgumentError.value(value, 'type', 'Unknown cook space type'),
    };
  }
}

class CookSpace {
  const CookSpace({
    required this.spaceId,
    required this.role,
    required this.joinedAt,
    required this.type,
    required this.name,
    required this.isActive,
  });

  final String spaceId;
  final String role;
  final String joinedAt;
  final CookSpaceType type;
  final String name;
  final bool isActive;
}
