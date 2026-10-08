import 'package:cook_app/utils/logger.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../data/services/token_storage.dart';
import '../ui/auth/login/widgets/login_screen.dart';
import '../ui/home/widgets/home_screen.dart';
import '../ui/home/widgets/no_space_screen.dart';
import 'routes.dart';

part 'router.g.dart';

@Riverpod(keepAlive: true)
GoRouter router(Ref ref) {
  final storage = ref.watch(tokenStorageProvider);
  final router = GoRouter(
    initialLocation: Routes.home,
    debugLogDiagnostics: true,
    refreshListenable: storage.refreshListenable,
    routes: [
      GoRoute(
        path: Routes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: Routes.home,
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: Routes.noSpace,
        builder: (context, state) => const NoSpaceScreen(),
      ),
    ],
    redirect: (context, state) async {
      final loggedIn = await storage.getToken() != null;
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
  ref.onDispose(router.dispose);
  return router;
}
