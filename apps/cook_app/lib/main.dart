import 'package:flutter/material.dart';

import 'ui/core/themes/theme.dart';
import 'routing/router.dart';

void main() {
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      routerConfig: router,
      theme: AppTheme.lightTheme(),
      themeMode: ThemeMode.light,
    );
  }
}
