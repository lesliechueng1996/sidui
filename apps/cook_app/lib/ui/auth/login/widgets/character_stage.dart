import 'dart:math' as math;

import 'package:cook_app/ui/auth/login/widgets/cook_character.dart';
import 'package:cook_app/ui/auth/login/widgets/gaze_bus.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

class _Buddy {
  const _Buddy({
    required this.color,
    required this.width,
    required this.height,
    required this.compactWidth,
    required this.compactHeight,
    required this.lag,
    required this.hands,
  });

  final Color color;
  final double width;
  final double height;
  final double compactWidth;
  final double compactHeight;
  final double lag;
  final HandStyle hands;
}

const _buddies = [
  _Buddy(
    color: Color(0xFFE36D5C),
    width: 108,
    height: 162,
    compactWidth: 52,
    compactHeight: 78,
    lag: 0.08,
    hands: HandStyle.both,
  ),
  _Buddy(
    color: AppColors.amber2,
    width: 78,
    height: 117,
    compactWidth: 40,
    compactHeight: 60,
    lag: 0.18,
    hands: HandStyle.none,
  ),
  _Buddy(
    color: AppColors.blue2,
    width: 92,
    height: 138,
    compactWidth: 46,
    compactHeight: 69,
    lag: 0.12,
    hands: HandStyle.single,
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
  late final AnimationController _pose;
  late final AnimationController _enter;

  final _smooth = <Offset>[];
  final _blinkOpen = [1.0, 1.0, 1.0];
  final _blinkPhase = [0, 0, 0];
  final _blinkElapsed = [0.0, 0.0, 0.0];
  final _blinkWait = [0.45, 1.05, 1.55];
  final _random = math.Random();
  Duration? _lastTick;

  var _visualMode = GazeMode.idle;
  var _generation = 0;
  var _reduceMotion = false;
  var _booted = false;

  @override
  void initState() {
    super.initState();
    _pose = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 680),
      reverseDuration: const Duration(milliseconds: 320),
    );
    _enter = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 540),
    );
    _track = createTicker(_onTick);
    widget.gazeBus.mode.addListener(_onModeChanged);
    _pose.addListener(_rebuild);
    _enter.addListener(_rebuild);
  }

  void _rebuild() {
    if (mounted) {
      setState(() {});
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _reduceMotion = MediaQuery.disableAnimationsOf(context);
    if (!_booted) {
      _booted = true;
      if (_reduceMotion) {
        _enter.value = 1;
      } else {
        _enter.forward();
      }
    }
    _syncTicker();
  }

  @override
  void didUpdateWidget(covariant CharacterStage oldWidget) {
    super.didUpdateWidget(oldWidget);
    _syncTicker();
  }

  void _syncTicker() {
    final run = !_reduceMotion;
    if (run && !_track.isActive) {
      _lastTick = null;
      _track.start();
    }
    if (!run && _track.isActive) {
      _track.stop();
      _lastTick = null;
      _smooth.clear();
    }
  }

  void _onTick(Duration elapsed) {
    if (!mounted || _reduceMotion) {
      return;
    }

    final previous = _lastTick;
    _lastTick = elapsed;
    if (previous == null) {
      return;
    }

    final dt = (elapsed - previous).inMicroseconds / 1000000;
    if (dt <= 0) {
      return;
    }
    final safeDt = dt > 0.05 ? 0.05 : dt;
    var dirty = _advanceBlinks(safeDt);
    if (!widget.isCompact) {
      dirty = _advanceGaze() || dirty;
    }
    if (dirty) {
      setState(() {});
    }
  }

  bool _advanceGaze() {
    final box = context.findRenderObject() as RenderBox?;
    if (box == null || !box.hasSize) {
      return false;
    }

    final target = _target(box.size, box);
    if (_smooth.isEmpty) {
      _smooth.addAll(List.filled(_buddies.length, target));
      return true;
    }

    var moved = false;
    for (var i = 0; i < _buddies.length; i++) {
      final next = Offset.lerp(_smooth[i], target, _buddies[i].lag)!;
      if ((next - _smooth[i]).distance > 0.2) {
        _smooth[i] = next;
        moved = true;
      }
    }
    return moved;
  }

  bool _advanceBlinks(double dt) {
    var changed = false;
    for (var i = 0; i < _buddies.length; i++) {
      if (_isShy(_visualMode)) {
        if (_blinkPhase[i] != 0 || _blinkOpen[i] != 1) {
          _blinkPhase[i] = 0;
          _blinkOpen[i] = 1;
          _blinkElapsed[i] = 0;
          changed = true;
        }
        continue;
      }

      _blinkElapsed[i] += dt;
      switch (_blinkPhase[i]) {
        case 0:
          if (_blinkElapsed[i] >= _blinkWait[i]) {
            _blinkPhase[i] = 1;
            _blinkElapsed[i] = 0;
            changed = true;
          }
        case 1:
          {
            final progress = (_blinkElapsed[i] / 0.16).clamp(0.0, 1.0);
            _blinkOpen[i] = 1 - Curves.easeIn.transform(progress);
            changed = true;
            if (progress >= 1) {
              _blinkPhase[i] = 2;
              _blinkElapsed[i] = 0;
              _blinkOpen[i] = 0;
            }
          }
        case 2:
          _blinkOpen[i] = 0;
          if (_blinkElapsed[i] >= 0.09) {
            _blinkPhase[i] = 3;
            _blinkElapsed[i] = 0;
            changed = true;
          }
        case 3:
          {
            final progress = (_blinkElapsed[i] / 0.20).clamp(0.0, 1.0);
            _blinkOpen[i] = Curves.easeOut.transform(progress);
            changed = true;
            if (progress >= 1) {
              _blinkPhase[i] = 0;
              _blinkElapsed[i] = 0;
              _blinkOpen[i] = 1;
              _blinkWait[i] = 2.2 + _random.nextDouble() * 2.6;
            }
          }
      }
    }
    return changed;
  }

  Offset _target(Size size, RenderBox? box) {
    if (widget.isCompact || _isShy(_visualMode)) {
      return Offset(size.width / 2, size.height + 40);
    }
    if (_reduceMotion ||
        !widget.gazeBus.isPointerInside.value ||
        box == null ||
        !box.hasSize) {
      return Offset(size.width + 80, size.height * 0.48);
    }
    return box.globalToLocal(widget.gazeBus.look.value);
  }

  void _onModeChanged() {
    final nextMode = widget.gazeBus.mode.value;
    final generation = ++_generation;

    if (_isShy(nextMode)) {
      setState(() {
        _visualMode = nextMode;
      });
      if (_reduceMotion) {
        _pose.value = 1;
      } else {
        _pose.forward();
      }
      return;
    }

    if (_isShy(_visualMode)) {
      if (_reduceMotion) {
        _pose.value = 0;
        setState(() {
          _visualMode = GazeMode.idle;
        });
        return;
      }
      _pose.reverse().whenComplete(() {
        if (!mounted || generation != _generation) {
          return;
        }
        setState(() {
          _visualMode = GazeMode.idle;
        });
      });
    }
  }

  bool _isShy(GazeMode mode) {
    return mode == GazeMode.passwordVisible || mode == GazeMode.password;
  }

  double _interval(double t, double begin, double end, Curve curve) {
    if (t <= begin) {
      return 0;
    }
    if (t >= end) {
      return 1;
    }
    return curve.transform((t - begin) / (end - begin));
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final size = Size(constraints.maxWidth, constraints.maxHeight);
        final rects = _bodies(size);
        final box = context.findRenderObject() as RenderBox?;
        final fallback = _target(size, box);

        const paintOrder = [0, 2, 1];
        return Stack(
          clipBehavior: Clip.none,
          children: [
            for (final i in paintOrder) _placed(i, rects[i], fallback),
          ],
        );
      },
    );
  }

  Widget _placed(int index, Rect body, Offset fallback) {
    final look = _smooth.length == _buddies.length ? _smooth[index] : fallback;
    final eye = body.topLeft + CookCharacterMetrics.eyeCenterInBody(body.width);
    final close = _interval(
      _pose.value,
      0.02 + index * 0.06,
      0.32 + index * 0.06,
      Curves.easeInCubic,
    );
    final handsT = _interval(
      _pose.value,
      0.40 + index * 0.08,
      0.94,
      Curves.easeOutCubic,
    );
    final shut = switch (_visualMode) {
      GazeMode.password => 1.0,
      GazeMode.passwordVisible => 0.18,
      _ => 1.0,
    };
    final poseOpen = 1 - close * shut;
    final eyeOpen = _isShy(_visualMode)
        ? poseOpen
        : poseOpen * _blinkOpen[index];
    final handTarget = switch (_visualMode) {
      GazeMode.passwordVisible => 0.45,
      _ => 1.0,
    };
    final dx = look.dx - body.center.dx;
    final trackLean = (dx / 520).clamp(-1.0, 1.0) * 0.1;
    final lean = widget.isCompact
        ? 0.0
        : trackLean * (1 - _pose.value) + -0.05 * _pose.value;
    final appear = _interval(
      _enter.value,
      index * 0.12,
      0.72 + index * 0.08,
      Curves.easeOutCubic,
    );
    final travel = widget.isCompact ? -28.0 : 36.0;

    return Positioned(
      left: body.left,
      top: body.top,
      width: body.width,
      height: body.height,
      child: Opacity(
        opacity: appear.clamp(0.0, 1.0),
        child: Transform.translate(
          offset: Offset(0, (1 - appear) * travel),
          child: CookCharacter(
            width: body.width,
            height: body.height,
            color: _buddies[index].color,
            pupil: _pupil(look, eye),
            eyeOpen: eyeOpen.clamp(0.0, 1.0),
            lean: lean,
            handCover: _isShy(_visualMode) ? handsT * handTarget : 0,
            hands: widget.isCompact ? HandStyle.none : _buddies[index].hands,
          ),
        ),
      ),
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

  List<Rect> _bodies(Size size) {
    final overlap = widget.isCompact ? 14.0 : 36.0;
    final widths = [
      for (final buddy in _buddies)
        widget.isCompact ? buddy.compactWidth : buddy.width,
    ];
    final total =
        widths.fold<double>(0.0, (sum, width) => sum + width) -
        overlap * (widths.length - 1);
    var x = (size.width - total) / 2;
    final rects = <Rect>[];
    for (var i = 0; i < _buddies.length; i++) {
      final buddy = _buddies[i];
      final width = widths[i];
      final height = widget.isCompact ? buddy.compactHeight : buddy.height;
      final double top;
      if (widget.isCompact) {
        const eyeLine = 36.0;
        top = eyeLine - CookCharacterMetrics.eyeCenterInBody(width).dy;
      } else {
        top = size.height * 0.6 - height;
      }
      rects.add(Rect.fromLTWH(x, top, width, height));
      x += width - overlap;
    }
    return rects;
  }

  @override
  void dispose() {
    widget.gazeBus.mode.removeListener(_onModeChanged);
    _pose.removeListener(_rebuild);
    _enter.removeListener(_rebuild);
    _track.dispose();
    _pose.dispose();
    _enter.dispose();
    super.dispose();
  }
}
