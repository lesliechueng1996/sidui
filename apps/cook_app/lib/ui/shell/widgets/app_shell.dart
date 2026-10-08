import 'package:cook_app/routing/routes.dart';
import 'package:cook_app/ui/core/layout.dart';
import 'package:cook_app/ui/core/themes/theme.dart';
import 'package:cook_app/ui/shell/view_models/shell_view_model.dart';
import 'package:cook_app/ui/shell/widgets/account_tile.dart';
import 'package:cook_app/ui/shell/widgets/more_sheet.dart';
import 'package:cook_app/ui/shell/widgets/shell_destinations.dart';
import 'package:cook_app/ui/shell/widgets/sidebar.dart';
import 'package:cook_app/ui/shell/widgets/space_switcher.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(shellViewModelProvider);
    ref.listen(shellViewModelProvider, (previous, next) {
      if (next case AsyncData(:final value) when value.spaces.isEmpty) {
        context.go(Routes.noSpace);
      }
    });

    return switch (state) {
      AsyncData(:final value) when value.spaces.isNotEmpty => LayoutBuilder(
        builder: (context, constraints) {
          final currentPath = GoRouterState.of(context).matchedLocation;
          final wide = constraints.maxWidth >= AppLayout.desktopMinWidth;
          if (wide) {
            return _desktop(context, value, currentPath);
          }
          return _mobile(context, value, currentPath);
        },
      ),
      AsyncError(:final error) => _error(context, ref, error),
      _ => Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        body: const Center(child: CircularProgressIndicator()),
      ),
    };
  }

  Widget _desktop(BuildContext context, ShellData data, String currentPath) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Row(
        children: [
          Sidebar(
            spaces: data.spaces,
            activeSpace: data.activeSpace,
            userName: data.user.name,
            currentPath: currentPath,
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _BreadcrumbBar(
                  spaceName: data.activeSpace.name,
                  pageLabel: _pageLabel(currentPath),
                ),
                Expanded(child: child),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String? _pageLabel(String currentPath) {
    for (final destination in shellDestinations) {
      if (destination.path == currentPath) {
        return destination.label;
      }
    }
    if (currentPath == Routes.settings) {
      return '设置';
    }
    return null;
  }

  Widget _mobile(BuildContext context, ShellData data, String currentPath) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Column(
        children: [
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 16, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: SpaceSwitcher(
                        spaces: data.spaces,
                        activeSpace: data.activeSpace,
                        compact: true,
                      ),
                    ),
                  ),
                  AccountTile(
                    name: data.user.name,
                    compact: true,
                    selected: currentPath == Routes.settings,
                    onTap: () => context.go(Routes.settings),
                  ),
                ],
              ),
            ),
          ),
          Expanded(child: child),
        ],
      ),
      bottomNavigationBar: _BottomBar(currentPath: currentPath),
    );
  }

  Widget _error(BuildContext context, WidgetRef ref, Object error) {
    final scheme = Theme.of(context).colorScheme;
    final message = ref.read(shellViewModelProvider.notifier).messageOf(error);
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                message,
                textAlign: TextAlign.center,
                style: AppFonts.text(fontSize: 16, color: scheme.error),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () {
                  ref.read(shellViewModelProvider.notifier).retry();
                },
                child: const Text('重试'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BreadcrumbBar extends StatelessWidget {
  const _BreadcrumbBar({required this.spaceName, required this.pageLabel});

  final String spaceName;
  final String? pageLabel;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return ColoredBox(
      color: scheme.surface,
      child: SizedBox(
        height: 56,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Row(
            children: [
              Flexible(
                child: Text(
                  spaceName,
                  overflow: TextOverflow.ellipsis,
                  style: AppFonts.text(
                    fontSize: 14,
                    color: scheme.onSurfaceVariant,
                  ),
                ),
              ),
              if (pageLabel != null) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Text(
                    '/',
                    style: AppFonts.text(
                      fontSize: 14,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ),
                Flexible(
                  child: Text(
                    pageLabel!,
                    overflow: TextOverflow.ellipsis,
                    style: AppFonts.text(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: scheme.onSurface,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _BottomBar extends StatelessWidget {
  const _BottomBar({required this.currentPath});

  final String currentPath;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final pinned = [
      for (final destination in shellDestinations)
        if (destination.inBottomBar) destination,
    ];
    final moreSelected = shellDestinations.any(
      (destination) =>
          !destination.inBottomBar && destination.path == currentPath,
    );
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        border: Border(top: BorderSide(color: scheme.outline)),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
          child: Row(
            children: [
              for (final destination in pinned)
                Expanded(
                  child: _BottomItem(
                    label: destination.label,
                    icon: destination.icon,
                    selected: currentPath == destination.path,
                    onTap: () => context.go(destination.path),
                  ),
                ),
              Expanded(
                child: _BottomItem(
                  label: '更多',
                  icon: Icons.more_horiz,
                  selected: moreSelected,
                  onTap: () => showShellMoreSheet(
                    context: context,
                    currentPath: currentPath,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BottomItem extends StatelessWidget {
  const _BottomItem({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final color = selected ? scheme.primary : scheme.onSurfaceVariant;
    return InkWell(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 22, color: color),
          const SizedBox(height: 4),
          Text(
            label,
            style: AppFonts.text(
              fontSize: 11,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
