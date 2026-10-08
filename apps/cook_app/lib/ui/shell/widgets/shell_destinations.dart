import 'package:cook_app/routing/routes.dart';
import 'package:flutter/material.dart';

class ShellDestination {
  const ShellDestination({
    required this.label,
    required this.path,
    required this.icon,
    required this.inBottomBar,
  });

  final String label;
  final String path;
  final IconData icon;
  final bool inBottomBar;
}

const shellDestinations = <ShellDestination>[
  ShellDestination(
    label: '概览',
    path: Routes.home,
    icon: Icons.grid_view_outlined,
    inBottomBar: true,
  ),
  ShellDestination(
    label: '库存',
    path: Routes.pantry,
    icon: Icons.inventory_2_outlined,
    inBottomBar: true,
  ),
  ShellDestination(
    label: '食谱',
    path: Routes.recipes,
    icon: Icons.menu_book_outlined,
    inBottomBar: true,
  ),
  ShellDestination(
    label: '饮食记录',
    path: Routes.meals,
    icon: Icons.restaurant_outlined,
    inBottomBar: true,
  ),
  ShellDestination(
    label: '厨具',
    path: Routes.cookware,
    icon: Icons.kitchen_outlined,
    inBottomBar: false,
  ),
  ShellDestination(
    label: '体重',
    path: Routes.weight,
    icon: Icons.monitor_weight_outlined,
    inBottomBar: false,
  ),
];
