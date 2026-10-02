import 'package:cook_app/data/services/token_storage.dart';
import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: TextButton(
          onPressed: () {
            tokenStorage.deleteToken();
          },
          child: Text('Clear Token'),
        ),
      ),
    );
  }
}
