import 'package:cook_app/ui/auth/login/widgets/cook_character.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:cook_app/utils/logger.dart';
import 'package:flutter/material.dart';
import 'package:cook_app/ui/auth/login/widgets/gaze_bus.dart';
import 'package:flutter/scheduler.dart';

class _Buddy {
  final Color color;
  final double width;
  final double height;
  final double compactWidth;
  final double compactHeight;
  final double lag;

  _Buddy({
    required this.color,
    required this.width,
    required this.height,
    required this.compactWidth,
    required this.compactHeight,
    required this.lag,
  });
}

final _buddies = [
  _Buddy(
    color: AppColors.green3,
    width: 108,
    height: 162,
    compactWidth: 52,
    compactHeight: 78,
    lag: 0.08,
  ),
  _Buddy(
    color: AppColors.amber2,
    width: 78,
    height: 117,
    compactWidth: 40,
    compactHeight: 60,
    lag: 0.18,
  ),
  _Buddy(
    color: AppColors.blue2,
    width: 92,
    height: 138,
    compactWidth: 46,
    compactHeight: 69,
    lag: 0.12,
  ),
];

class CharacterStage extends StatefulWidget {
  const CharacterStage({
    super.key,
    required this.isCompact,
    required this.gazeBus,
  });

  final bool isCompact;
  final GazeBus gazeBus;

  @override
  State<CharacterStage> createState() => _CharacterStageState();
}

class _CharacterStageState extends State<CharacterStage>
    with TickerProviderStateMixin {
  late final Ticker _track;
  final _smooth = <Offset>[];

  @override
  void initState() {
    _track = createTicker(onTick);
    super.initState();
  }

  @override
  void didChangeDependencies() {
    _syncTicker();
    super.didChangeDependencies();
  }

  @override
  void didUpdateWidget(covariant CharacterStage oldWidget) {
    _syncTicker();
    super.didUpdateWidget(oldWidget);
  }

  void onTick(Duration elapsed) {
    // Stop tracking if the component is not mounted or is compact (Mobile).
    if (!mounted || widget.isCompact) {
      return;
    }

    final box = context.findRenderObject() as RenderBox?;
    if (box == null || !box.hasSize) {
      return;
    }

    final target = _target(box.size, box);
    if (_smooth.isEmpty) {
      _smooth.addAll(List.filled(_buddies.length, target));
      setState(() {});
      return;
    }

    var moved = false;
    for (var i = 0; i < _buddies.length; i++) {
      final next = Offset.lerp(_smooth[i], target, _buddies[i].lag)!;
      if ((next - _smooth[i]).distance > 0.2) {
        _smooth[i] = next;
        moved = true;
      }
    }

    if (moved) {
      setState(() {});
    }
  }

  void _syncTicker() {
    final run = !widget.isCompact;

    if (run && !_track.isActive) {
      _track.start();
    }

    if (!run && _track.isActive) {
      _track.stop();
      _smooth.clear();
    }
  }

  Offset _target(Size size, RenderBox? box) {
    if (widget.isCompact) {
      return Offset(size.width / 2, size.height * 0.48);
    }
    if (!widget.gazeBus.isPointerInside.value || box == null || !box.hasSize) {
      return Offset(size.width + 80, size.height * 0.48);
    }
    return box.globalToLocal(widget.gazeBus.look.value);
  }

  List<Rect> _bodies(Size size) {
    const gap = 28.0;
    final widths = [
      for (final buddy in _buddies)
        widget.isCompact ? buddy.compactWidth : buddy.width,
    ];
    final total =
        widths.fold(0.0, (sum, width) => sum + width) +
        gap * (widths.length - 1);
    var x = (size.width - total) / 2;
    final rects = <Rect>[];
    for (final buddy in _buddies) {
      final width = widget.isCompact ? buddy.compactWidth : buddy.width;
      final height = widget.isCompact ? buddy.compactHeight : buddy.height;
      final double top = widget.isCompact
          ? size.height - height
          : size.height * 0.6 - height;
      rects.add(Rect.fromLTWH(x, top, width, height));
      x += width + gap;
    }
    return rects;
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final size = Size(constraints.maxWidth, constraints.maxHeight);
        final rects = _bodies(size);
        final box = context.findRenderObject() as RenderBox?;
        final fallback = _target(size, box);

        return Stack(
          clipBehavior: Clip.none,
          children: [
            for (var i = 0; i < rects.length; i++)
              _placed(i, rects[i], fallback),
          ],
        );
      },
    );
  }

  Offset _pupil(Offset look, Offset eye) {
    final delta = look - eye;
    final dist = delta.distance;
    if (dist < 1) {
      return Offset.zero;
    }
    const influence = 280.0;
    final t = (dist / influence).clamp(0.0, 1.0);
    return Offset(delta.dx / dist * t, delta.dy / dist * t);
  }

  Widget _placed(int index, Rect body, Offset fallback) {
    final look = _smooth.length == _buddies.length ? _smooth[index] : fallback;
    final eye = body.topLeft + CookCharacterMetrics.eyeCenterInBody(body.width);
    final dx = look.dx - body.center.dx;
    final lean = widget.isCompact ? 0.0 : (dx / 520).clamp(-1.0, 1.0) * 0.1;

    return Positioned(
      left: body.left,
      top: body.top,
      width: body.width,
      height: body.height,
      child: CookCharacter(
        width: body.width,
        height: body.height,
        color: _buddies[index].color,
        pupil: _pupil(look, eye),
        eyeOpen: 1,
        lean: lean,
      ),
    );
  }

  @override
  void dispose() {
    _track.dispose();
    super.dispose();
  }
}
