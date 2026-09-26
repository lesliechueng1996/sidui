import 'package:cook_app/utils/logger.dart';
import 'package:go_router/go_router.dart';

import '../data/services/token_storage.dart';
import '../ui/auth/login/widgets/login_screen.dart';
import '../ui/home/widgets/home_screen.dart';
import 'routes.dart';

GoRouter buildRouter() {
  final router = GoRouter(
    initialLocation: Routes.home,
    debugLogDiagnostics: true,
    refreshListenable: tokenStorage,
    routes: [
      GoRoute(path: Routes.login, builder: (context, state) => LoginScreen()),
      GoRoute(path: Routes.home, builder: (context, state) => HomeScreen()),
    ],
    redirect: (context, state) async {
      final loggedIn = await tokenStorage.getToken() != null;
      final onLogin = state.matchedLocation == Routes.login;
      if (!loggedIn && !onLogin) {
        talker.info('Redirecting to login page');
        return Routes.login;
      }
      if (loggedIn && onLogin) {
        return Routes.home;
      }
      return null;
    },
  );
  return router;
}

final router = buildRouter();
