import 'package:cook_app/ui/auth/login/widgets/character_stage.dart';
import 'package:cook_app/ui/auth/login/widgets/gaze_bus.dart';
import 'package:cook_app/ui/auth/login/widgets/login_form.dart';
import 'package:cook_app/ui/core/layout.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

class LoginScreen extends HookWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final gazeBus = useMemoized(GazeBus.new);
    useEffect(() => gazeBus.dispose, [gazeBus]);

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
            final isDesktop = constraints.maxWidth >= AppLayout.desktopMinWidth;
            return MouseRegion(
              onEnter: (_) => gazeBus.isPointerInside.value = true,
              onExit: (_) => gazeBus.isPointerInside.value = false,
              onHover: (event) {
                gazeBus.isPointerInside.value = true;
                gazeBus.look.value = event.position;
              },
              child: isDesktop ? _desktop(gazeBus) : _mobile(gazeBus),
            );
          },
        ),
      ),
    );
  }

  Widget _desktop(GazeBus gazeBus) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(child: CharacterStage(isCompact: false, gazeBus: gazeBus)),
        SizedBox(
          width: 480,
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 28),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 380),
                child: LoginForm(gazeBus: gazeBus),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _mobile(GazeBus gazeBus) {
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
                    child: CharacterStage(isCompact: true, gazeBus: gazeBus),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(top: 48),
                    child: LoginForm(gazeBus: gazeBus, showBrand: false),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
