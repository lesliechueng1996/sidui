import 'package:cook_app/ui/auth/login/widgets/character_stage.dart';
import 'package:cook_app/ui/auth/login/widgets/gaze_bus.dart';
import 'package:cook_app/ui/auth/login/widgets/login_form.dart';
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
      body: DecoratedBox(
        decoration: const BoxDecoration(
          image: DecorationImage(
            image: AssetImage('assets/images/login_bg.webp'),
            fit: BoxFit.cover,
          ),
        ),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isDesktop = constraints.maxWidth >= 900;
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
      ),
    );
  }

  Widget _desktop() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(child: CharacterStage(isCompact: false, gazeBus: _gazeBus)),
        SizedBox(
          width: 480,
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 28),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 380),
                child: LoginForm(gazeBus: _gazeBus),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _mobile() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
        child: SizedBox(
          width: 380,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const LoginBrand(),
              const SizedBox(height: 8),
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 108,
                    child: CharacterStage(isCompact: true, gazeBus: _gazeBus),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 48),
                    child: LoginForm(gazeBus: _gazeBus, showBrand: false),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _gazeBus.dispose();
    super.dispose();
  }
}
