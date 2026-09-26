import 'package:go_router/go_router.dart';

import '../ui/auth/login/widgets/login_screen.dart';
import '../ui/home/widgets/home_screen.dart';
import 'routes.dart';

final router = GoRouter(
  initialLocation: Routes.home,
  debugLogDiagnostics: true,
  routes: [
    GoRoute(path: Routes.login, builder: (context, state) => LoginScreen()),
    GoRoute(path: Routes.home, builder: (context, state) => HomeScreen()),
  ],
);
