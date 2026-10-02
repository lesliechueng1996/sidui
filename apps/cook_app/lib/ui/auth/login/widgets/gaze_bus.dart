import 'package:flutter/material.dart';

enum GazeMode { idle, email, password, passwordVisible }

class GazeBus {
  final look = ValueNotifier<Offset>(Offset.zero);
  final isPointerInside = ValueNotifier<bool>(false);
  final mode = ValueNotifier<GazeMode>(GazeMode.idle);

  void dispose() {
    look.dispose();
    isPointerInside.dispose();
    mode.dispose();
  }
}
