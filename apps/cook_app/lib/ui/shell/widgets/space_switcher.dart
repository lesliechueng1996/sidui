import 'package:cook_app/domain/model/cook_space.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:cook_app/ui/core/themes/theme.dart';
import 'package:flutter/material.dart';

class SpaceSwitcher extends StatelessWidget {
  const SpaceSwitcher({
    super.key,
    required this.spaces,
    required this.activeSpace,
    this.compact = false,
  });

  final List<CookSpace> spaces;
  final CookSpace activeSpace;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final theme = Theme.of(context);
    return Theme(
      data: theme.copyWith(
        splashFactory: NoSplash.splashFactory,
        hoverColor: Colors.transparent,
        highlightColor: Colors.transparent,
        splashColor: Colors.transparent,
      ),
      child: PopupMenuButton<String>(
        tooltip: '空间',
        padding: EdgeInsets.zero,
        offset: const Offset(0, 8),
        color: scheme.surface,
        elevation: 8,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        itemBuilder: (context) {
          return [
            for (final space in spaces)
              PopupMenuItem<String>(
                value: space.spaceId,
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        space.name,
                        overflow: TextOverflow.ellipsis,
                        style: AppFonts.text(
                          fontSize: 14,
                          color: scheme.onSurface,
                        ),
                      ),
                    ),
                    if (space.spaceId == activeSpace.spaceId)
                      Icon(Icons.check, size: 16, color: scheme.primary),
                  ],
                ),
              ),
          ];
        },
        child: compact ? _compact(context) : _full(context),
      ),
    );
  }

  Widget _full(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final extra = AppExtraColors.of(context);
    final family = activeSpace.type == CookSpaceType.family;
    final background = family ? scheme.tertiary : extra.primaryMuted;
    final iconBackground = family
        ? scheme.tertiaryContainer
        : scheme.primaryContainer;
    final iconColor = family ? scheme.onTertiaryContainer : scheme.primary;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: iconBackground,
                shape: BoxShape.circle,
              ),
              child: Icon(
                _kindIcon(activeSpace.type),
                size: 18,
                color: iconColor,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _kindLabel(activeSpace.type),
                    overflow: TextOverflow.ellipsis,
                    style: AppFonts.text(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: scheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Flexible(
                        fit: FlexFit.loose,
                        child: Text(
                          activeSpace.name,
                          overflow: TextOverflow.ellipsis,
                          style: AppFonts.text(
                            fontSize: 13,
                            color: scheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                      Icon(
                        Icons.keyboard_arrow_down,
                        size: 18,
                        color: scheme.onSurfaceVariant,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _compact(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Flexible(
          fit: FlexFit.loose,
          child: Text(
            activeSpace.name,
            overflow: TextOverflow.ellipsis,
            style: AppFonts.text(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: scheme.onSurface,
            ),
          ),
        ),
        Icon(
          Icons.keyboard_arrow_down,
          size: 20,
          color: scheme.onSurfaceVariant,
        ),
      ],
    );
  }
}

String _kindLabel(CookSpaceType type) {
  return switch (type) {
    CookSpaceType.personal => '个人空间',
    CookSpaceType.family => '家庭空间',
  };
}

IconData _kindIcon(CookSpaceType type) {
  return switch (type) {
    CookSpaceType.personal => Icons.person_outline,
    CookSpaceType.family => Icons.groups_outlined,
  };
}
