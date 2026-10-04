import 'package:cook_app/data/services/token_storage.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: Center(
        child: TextButton(
          onPressed: () {
            ref.read(tokenStorageProvider).deleteToken();
          },
          child: const Text('Clear Token'),
        ),
      ),
    );
  }
}
