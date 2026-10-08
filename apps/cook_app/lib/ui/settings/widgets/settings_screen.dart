import 'package:cook_app/ui/core/themes/theme.dart';
import 'package:cook_app/ui/settings/view_models/settings_view_model.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final viewModel = ref.watch(settingsViewModelProvider);
    final scheme = Theme.of(context).colorScheme;
    final signingOut = viewModel.isSigningOut;
    final errorMessage = viewModel.errorMessage;
    return Align(
      alignment: Alignment.topCenter,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(28, 36, 28, 28),
          children: [
            Text(
              '设置',
              style: AppFonts.text(
                fontSize: 28,
                fontWeight: FontWeight.w600,
                color: scheme.onSurface,
              ),
            ),
            const SizedBox(height: 28),
            Material(
              color: signingOut
                  ? scheme.error.withValues(alpha: 0.7)
                  : scheme.error,
              borderRadius: BorderRadius.circular(10),
              child: InkWell(
                onTap: signingOut ? null : viewModel.signOut,
                borderRadius: BorderRadius.circular(10),
                child: SizedBox(
                  height: 46,
                  child: Center(
                    child: signingOut
                        ? SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: scheme.onError,
                            ),
                          )
                        : Text(
                            '退出登录',
                            style: AppFonts.text(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: scheme.onError,
                            ),
                          ),
                  ),
                ),
              ),
            ),
            if (errorMessage != null) ...[
              const SizedBox(height: 12),
              Text(
                errorMessage,
                textAlign: TextAlign.center,
                style: AppFonts.text(fontSize: 13, color: scheme.error),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
