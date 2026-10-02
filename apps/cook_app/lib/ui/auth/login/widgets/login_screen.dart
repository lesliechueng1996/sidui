import 'package:cook_app/ui/auth/login/widgets/character_stage.dart';
import 'package:cook_app/ui/auth/login/widgets/gaze_bus.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _gazeBus = GazeBus();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isDesktop = constraints.maxWidth > 900;
          return MouseRegion(
            onEnter: (_) => _gazeBus.isPointerInside.value = true,
            onExit: (_) => _gazeBus.isPointerInside.value = false,
            onHover: (event) {
              _gazeBus.isPointerInside.value = true;
              _gazeBus.look.value = event.position;
            },
            child: isDesktop ? _desktop() : _mobile(),
          );
        },
      ),
    );
  }

  Widget _desktop() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(child: CharacterStage(isCompact: false, gazeBus: _gazeBus)),
        SizedBox(width: 460, child: ColoredBox(color: AppColors.amber2)),
      ],
    );
  }

  Widget _mobile() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 240,
          child: ColoredBox(
            color: AppColors.green1,
            child: CharacterStage(isCompact: true, gazeBus: _gazeBus),
          ),
        ),
        Expanded(child: ColoredBox(color: AppColors.green2)),
      ],
    );
  }

  @override
  void dispose() {
    _gazeBus.dispose();
    super.dispose();
  }
}
