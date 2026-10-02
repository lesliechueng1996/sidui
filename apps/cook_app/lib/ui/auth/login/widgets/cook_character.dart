import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

class CookCharacter extends StatelessWidget {
  final double width;
  final double height;
  final Color color;
  final Offset pupil;
  final double eyeOpen;
  final double lean;

  const CookCharacter({
    super.key,
    required this.width,
    required this.height,
    required this.color,
    required this.pupil,
    required this.eyeOpen,
    required this.lean,
  });

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      alignment: Alignment.bottomCenter,
      angle: lean,
      child: SizedBox(
        width: width,
        height: height,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.vertical(
                    top: Radius.circular(width / 2),
                  ),
                ),
              ),
            ),
            _eye(CookCharacterMetrics.eyeLeftOf(width)),
            _eye(CookCharacterMetrics.eyeRightOf(width)),
          ],
        ),
      ),
    );
  }

  Widget _eye(double left) {
    final eyeSize = CookCharacterMetrics.eyeSizeOf(width);

    return Positioned(
      left: left,
      top: CookCharacterMetrics.eyeTopOf(width),
      width: eyeSize,
      height: eyeSize,
      child: ClipOval(
        child: Stack(
          fit: StackFit.expand,
          children: [
            const ColoredBox(color: AppColors.white1),
            Align(
              alignment: Alignment(pupil.dx, pupil.dy),
              child: FractionallySizedBox(
                widthFactor: 0.42,
                heightFactor: 0.42,
                child: const ColoredBox(color: AppColors.black1),
              ),
            ),
            Align(
              alignment: Alignment.topCenter,
              child: FractionallySizedBox(
                heightFactor: (1 - eyeOpen).clamp(0, 1),
                child: ColoredBox(color: color),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

abstract final class CookCharacterMetrics {
  static double eyeSizeOf(double width) => width * 0.22;

  static double eyeTopOf(double width) => width * 0.16;

  static double eyeLeftOf(double width) => width * 0.22;

  static double eyeRightOf(double width) => width * 0.56;

  static Offset eyeCenterInBody(double width) {
    final eye = eyeSizeOf(width);
    final top = eyeTopOf(width);
    final left = eyeLeftOf(width);
    final right = eyeRightOf(width);
    final midX = (left + eye / 2 + right + eye / 2) / 2;
    return Offset(midX, top + eye / 2);
  }
}
