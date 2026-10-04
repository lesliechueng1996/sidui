import 'dart:ui' as ui;

import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

enum HandStyle { none, single, both }

class CookCharacter extends StatelessWidget {
  final double width;
  final double height;
  final Color color;
  final Offset pupil;
  final double eyeOpen;
  final double lean;
  final double handCover;
  final HandStyle hands;

  const CookCharacter({
    super.key,
    required this.width,
    required this.height,
    required this.color,
    required this.pupil,
    required this.eyeOpen,
    required this.lean,
    required this.handCover,
    required this.hands,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            left: width * 0.16,
            right: width * 0.16,
            bottom: -height * 0.015,
            height: height * 0.045,
            child: ImageFiltered(
              imageFilter: ui.ImageFilter.blur(sigmaX: 5, sigmaY: 2.5),
              child: const DecoratedBox(
                decoration: BoxDecoration(
                  color: Color(0x4D000000),
                  borderRadius: BorderRadius.all(Radius.circular(40)),
                ),
              ),
            ),
          ),
          Transform(
            alignment: Alignment.bottomCenter,
            filterQuality: FilterQuality.medium,
            transform: Matrix4.skewX(-lean),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.vertical(
                    top: Radius.circular(width / 2),
                  ),
                  child: Stack(
                    children: [
                      Positioned.fill(child: DecoratedBox(decoration: _body)),
                      _highlight(),
                      _eye(CookCharacterMetrics.eyeLeftOf(width)),
                      _eye(CookCharacterMetrics.eyeRightOf(width)),
                    ],
                  ),
                ),
                if (hands != HandStyle.none && handCover > 0) _hands(height),
              ],
            ),
          ),
        ],
      ),
    );
  }

  BoxDecoration get _body {
    return BoxDecoration(
      gradient: LinearGradient(
        begin: const Alignment(-0.8, -1),
        end: const Alignment(0.5, 1),
        colors: [
          Color.lerp(color, AppColors.white1, 0.32)!,
          color,
          Color.lerp(color, AppColors.black1, 0.16)!,
        ],
        stops: const [0, 0.46, 1],
      ),
    );
  }

  Widget _highlight() {
    return Positioned(
      left: width * 0.30,
      top: width * 0.055,
      width: width * 0.16,
      height: width * 0.065,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: AppColors.white1.withValues(alpha: 0.42),
          borderRadius: BorderRadius.circular(width),
        ),
      ),
    );
  }

  Widget _hands(double height) {
    final isSingle = hands == HandStyle.single;
    final handW = isSingle ? width * 0.82 : width * 0.52;
    final handH = handW * 1.28;
    final eyeTop = CookCharacterMetrics.eyeTopOf(width);
    final eyeSize = CookCharacterMetrics.eyeSizeOf(width);
    final coverTop = eyeTop - handH * 0.08;
    final shown = handCover.clamp(0.0, 1.0);

    if (isSingle) {
      final rest = Offset(width * 0.42, height * 0.64);
      final over = Offset((width - handW) / 2, coverTop);
      return _hand(
        Offset.lerp(rest, over, shown)!,
        handW,
        handH,
        shown,
        thumbOnLeft: false,
      );
    }

    final leftEye = CookCharacterMetrics.eyeLeftOf(width) + eyeSize / 2;
    final rightEye = CookCharacterMetrics.eyeRightOf(width) + eyeSize / 2;
    final leftRest = Offset(-handW * 0.15, height * 0.66);
    final rightRest = Offset(width - handW * 0.72, height * 0.66);
    final leftOver = Offset(leftEye - handW * 0.58, coverTop);
    final rightOver = Offset(rightEye - handW * 0.42, coverTop);
    return Stack(
      clipBehavior: Clip.none,
      children: [
        _hand(
          Offset.lerp(leftRest, leftOver, shown)!,
          handW,
          handH,
          shown,
          thumbOnLeft: true,
        ),
        _hand(
          Offset.lerp(rightRest, rightOver, shown)!,
          handW,
          handH,
          shown,
          thumbOnLeft: false,
        ),
      ],
    );
  }

  Widget _hand(
    Offset origin,
    double handW,
    double handH,
    double shown, {
    required bool thumbOnLeft,
  }) {
    return Positioned(
      left: origin.dx,
      top: origin.dy,
      width: handW,
      height: handH,
      child: Opacity(
        opacity: shown,
        child: CustomPaint(
          painter: _HandPainter(color: color, thumbOnLeft: thumbOnLeft),
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
      child: CustomPaint(
        painter: _EyePainter(
          open: eyeOpen.clamp(0.0, 1.0),
          pupil: pupil,
          iris: color,
        ),
      ),
    );
  }
}

class _EyePainter extends CustomPainter {
  const _EyePainter({
    required this.open,
    required this.pupil,
    required this.iris,
  });

  final double open;
  final Offset pupil;
  final Color iris;

  @override
  void paint(Canvas canvas, Size size) {
    final t = open.clamp(0.0, 1.0);
    final center = Offset(size.width / 2, size.height / 2);
    final lid = Color.lerp(iris, AppColors.black1, 0.55)!;
    final eyeAlpha = t >= 0.3 ? 1.0 : (t / 0.3).clamp(0.0, 1.0);

    if (eyeAlpha > 0) {
      canvas.saveLayer(
        Offset.zero & size,
        Paint()
          ..color = Color.fromARGB((eyeAlpha * 255).round(), 255, 255, 255),
      );
      canvas.save();
      canvas.translate(center.dx, center.dy);
      canvas.scale(1, 0.16 + 0.84 * t);
      canvas.translate(-center.dx, -center.dy);
      final eye = Rect.fromCircle(center: center, radius: size.width / 2);
      canvas.clipPath(Path()..addOval(eye));
      canvas.drawOval(eye, Paint()..color = const Color(0xFFF6F3EE));

      final shift = Offset(
        pupil.dx.clamp(-1.0, 1.0) * size.width * 0.16,
        pupil.dy.clamp(-1.0, 1.0) * size.height * 0.16,
      );
      final pupilCenter = center + shift;
      canvas.drawCircle(
        pupilCenter,
        size.width * 0.20,
        Paint()..color = Color.lerp(iris, AppColors.black1, 0.38)!,
      );
      canvas.drawCircle(
        pupilCenter,
        size.width * 0.105,
        Paint()..color = const Color(0xFF1C1C1E),
      );
      canvas.drawCircle(
        pupilCenter + Offset(-size.width * 0.045, -size.width * 0.045),
        size.width * 0.032,
        Paint()..color = const Color(0xFFF8F6F2),
      );
      canvas.restore();
      canvas.restore();
    }

    if (t < 0.22) {
      final strength = ((0.22 - t) / 0.22).clamp(0.0, 1.0);
      final y = size.height * 0.50;
      final arc = Path()
        ..moveTo(size.width * 0.12, y)
        ..quadraticBezierTo(
          size.width * 0.50,
          y + size.height * 0.26 * strength,
          size.width * 0.88,
          y,
        );
      canvas.drawPath(
        arc,
        Paint()
          ..color = lid.withValues(alpha: 0.35 + 0.65 * strength)
          ..style = PaintingStyle.stroke
          ..strokeWidth = size.width * (0.09 + 0.13 * strength)
          ..strokeCap = StrokeCap.round,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _EyePainter oldDelegate) {
    return oldDelegate.open != open ||
        oldDelegate.pupil != pupil ||
        oldDelegate.iris != iris;
  }
}

class _HandPainter extends CustomPainter {
  const _HandPainter({required this.color, required this.thumbOnLeft});

  final Color color;
  final bool thumbOnLeft;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    canvas.drawOval(
      Rect.fromLTWH(w * 0.16, h * 0.34, w * 0.68, h * 0.46),
      Paint()
        ..color = const Color(0x33000000)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 5),
    );

    canvas.save();
    if (!thumbOnLeft) {
      canvas.translate(w, 0);
      canvas.scale(-1, 1);
    }

    final skin = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Color.lerp(color, AppColors.white1, 0.26)!,
          color,
          Color.lerp(color, AppColors.black1, 0.12)!,
        ],
        stops: const [0, 0.55, 1],
      ).createShader(Offset.zero & size);

    final fingers = <RRect>[
      _finger(w, h, 0.24, 0.14, 0.15, 0.40),
      _finger(w, h, 0.41, 0.04, 0.16, 0.48),
      _finger(w, h, 0.59, 0.09, 0.15, 0.43),
      _finger(w, h, 0.76, 0.18, 0.13, 0.34),
    ];
    var shape = Path()..addRRect(fingers.first);
    for (final finger in fingers.skip(1)) {
      shape = Path.combine(
        PathOperation.union,
        shape,
        Path()..addRRect(finger),
      );
    }

    final palm = RRect.fromRectAndRadius(
      Rect.fromLTWH(w * 0.20, h * 0.42, w * 0.72, h * 0.36),
      Radius.circular(w * 0.18),
    );
    shape = Path.combine(PathOperation.union, shape, Path()..addRRect(palm));

    final wrist = RRect.fromRectAndRadius(
      Rect.fromLTWH(w * 0.34, h * 0.68, w * 0.40, h * 0.32),
      Radius.circular(w * 0.14),
    );
    shape = Path.combine(PathOperation.union, shape, Path()..addRRect(wrist));

    final thumb = RRect.fromRectAndRadius(
      Rect.fromCenter(center: Offset.zero, width: w * 0.22, height: h * 0.30),
      Radius.circular(w * 0.09),
    );
    final thumbPath = Path()..addRRect(thumb);
    final thumbMatrix = Matrix4.identity()
      ..translateByDouble(w * 0.16, h * 0.58, 0, 1)
      ..rotateZ(-0.75);
    shape = Path.combine(
      PathOperation.union,
      shape,
      thumbPath.transform(thumbMatrix.storage),
    );

    canvas.drawPath(shape, skin);
    canvas.drawPath(
      shape,
      Paint()
        ..color = Color.lerp(
          color,
          AppColors.black1,
          0.28,
        )!.withValues(alpha: 0.28)
        ..style = PaintingStyle.stroke
        ..strokeWidth = w * 0.018
        ..strokeJoin = StrokeJoin.round,
    );

    final nail = Paint()..color = Color.lerp(color, AppColors.white1, 0.45)!;
    for (final finger in fingers) {
      final nailRect = Rect.fromLTWH(
        finger.left + finger.width * 0.18,
        finger.top + finger.width * 0.16,
        finger.width * 0.64,
        finger.width * 0.42,
      );
      canvas.drawRRect(
        RRect.fromRectAndRadius(nailRect, Radius.circular(finger.width * 0.2)),
        nail,
      );
    }

    final crease = Paint()
      ..color = Color.lerp(
        color,
        AppColors.black1,
        0.28,
      )!.withValues(alpha: 0.45)
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.025
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(
      Path()
        ..moveTo(w * 0.34, h * 0.56)
        ..quadraticBezierTo(w * 0.54, h * 0.63, w * 0.76, h * 0.54),
      crease,
    );
    canvas.restore();
  }

  RRect _finger(double w, double h, double x, double y, double fw, double fh) {
    return RRect.fromRectAndRadius(
      Rect.fromLTWH(x * w, y * h, fw * w, fh * h),
      Radius.circular(fw * w / 2),
    );
  }

  @override
  bool shouldRepaint(covariant _HandPainter oldDelegate) {
    return oldDelegate.color != color || oldDelegate.thumbOnLeft != thumbOnLeft;
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
