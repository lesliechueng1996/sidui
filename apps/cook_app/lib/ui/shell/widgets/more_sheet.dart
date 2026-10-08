import 'package:cook_app/ui/shell/widgets/nav_item.dart';
import 'package:cook_app/ui/shell/widgets/shell_destinations.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

void showShellMoreSheet({
  required BuildContext context,
  required String currentPath,
}) {
  final destinations = [
    for (final destination in shellDestinations)
      if (!destination.inBottomBar) destination,
  ];
  showModalBottomSheet<void>(
    context: context,
    backgroundColor: Theme.of(context).scaffoldBackgroundColor,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (sheetContext) {
      return SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (var i = 0; i < destinations.length; i++) ...[
                if (i > 0) const SizedBox(height: 4),
                NavItem(
                  label: destinations[i].label,
                  selected: currentPath == destinations[i].path,
                  onTap: () {
                    Navigator.of(sheetContext).pop();
                    context.go(destinations[i].path);
                  },
                ),
              ],
            ],
          ),
        ),
      );
    },
  );
}
