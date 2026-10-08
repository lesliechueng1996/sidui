import 'package:cook_app/data/repositories/auth_repository.dart';
import 'package:cook_app/routing/routes.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:cook_app/ui/core/themes/theme.dart';
import 'package:cook_app/ui/home/view_models/home_view_model.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final spaces = ref.watch(homeViewModelProvider);
    ref.listen(homeViewModelProvider, (previous, next) {
      if (next case AsyncData(:final value) when value.isEmpty) {
        context.go(Routes.noSpace);
      }
    });

    return switch (spaces) {
      AsyncData(:final value) when value.isNotEmpty => _loaded(ref),
      AsyncError(:final error) => _error(context, ref, error),
      _ => const Scaffold(
        backgroundColor: AppColors.canvas,
        body: Center(child: CircularProgressIndicator()),
      ),
    };
  }

  Widget _loaded(WidgetRef ref) {
    return Scaffold(
      body: Center(
        child: TextButton(
          onPressed: () {
            ref.read(authRepositoryProvider).signOut();
          },
          child: const Text('Clear Token'),
        ),
      ),
    );
  }

  Widget _error(BuildContext context, WidgetRef ref, Object error) {
    final scheme = Theme.of(context).colorScheme;
    final message = ref.read(homeViewModelProvider.notifier).messageOf(error);
    return Scaffold(
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
                  ref.read(homeViewModelProvider.notifier).retry();
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
