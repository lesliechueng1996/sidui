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
  final String type;
  final String name;
  final bool isActive;
}
