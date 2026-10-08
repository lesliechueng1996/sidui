import 'package:cook_app/domain/model/cook_space.dart';
import 'package:cook_app/routing/routes.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:cook_app/ui/core/themes/theme.dart';
import 'package:cook_app/ui/shell/widgets/account_tile.dart';
import 'package:cook_app/ui/shell/widgets/nav_item.dart';
import 'package:cook_app/ui/shell/widgets/shell_destinations.dart';
import 'package:cook_app/ui/shell/widgets/space_switcher.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class Sidebar extends StatelessWidget {
  const Sidebar({
    super.key,
    required this.spaces,
    required this.activeSpace,
    required this.userName,
    required this.currentPath,
  });

  final List<CookSpace> spaces;
  final CookSpace activeSpace;
  final String userName;
  final String currentPath;

  static const width = 248.0;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppExtraColors.of(context).sidebar,
      child: SizedBox(
        width: width,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const _Brand(),
              const SizedBox(height: 28),
              SpaceSwitcher(spaces: spaces, activeSpace: activeSpace),
              const SizedBox(height: 32),
              for (var i = 0; i < shellDestinations.length; i++) ...[
                if (i > 0) const SizedBox(height: 4),
                NavItem(
                  label: shellDestinations[i].label,
                  selected: currentPath == shellDestinations[i].path,
                  onTap: () => context.go(shellDestinations[i].path),
                ),
              ],
              const Spacer(),
              AccountTile(
                name: userName,
                selected: currentPath == Routes.settings,
                onTap: () => context.go(Routes.settings),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Brand extends StatelessWidget {
  const _Brand();

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Image.asset('assets/images/logo.png', width: 36, height: 36),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Mise',
                style: AppFonts.text(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: scheme.onSurface,
                  height: 1.05,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'KITCHEN JOURNAL',
                style: AppFonts.text(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  color: scheme.onSurfaceVariant,
                  letterSpacing: 1.2,
                  height: 1.1,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
