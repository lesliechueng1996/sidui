import 'package:cook_app/ui/auth/login/widgets/gaze_bus.dart';
import 'package:cook_app/ui/core/themes/theme.dart';
import 'package:flutter/material.dart';

const _ink = Color(0xFF20352A);
const _green = Color(0xFF168553);
const _muted = Color(0xFF7D8B84);
const _line = Color(0xFFD9E0DB);
const _hint = Color(0xFFA3ADA8);

class LoginForm extends StatefulWidget {
  const LoginForm({super.key, required this.gazeBus, this.showBrand = true});

  final GazeBus gazeBus;
  final bool showBrand;

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  bool _obscure = true;

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailFocusNode = FocusNode();
  final _passwordFocusNode = FocusNode();

  @override
  void initState() {
    _emailFocusNode.addListener(_sync);
    _passwordFocusNode.addListener(_sync);
    super.initState();
  }

  void _sync() {
    var next = GazeMode.idle;
    if (_passwordFocusNode.hasFocus) {
      next = _obscure ? GazeMode.password : GazeMode.passwordVisible;
    } else if (_emailFocusNode.hasFocus) {
      next = GazeMode.email;
    }

    widget.gazeBus.mode.value = next;
    if (mounted) {
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (widget.showBrand) ...const [LoginBrand(), SizedBox(height: 28)],
        DecoratedBox(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: const [
              BoxShadow(
                color: Color(0x1420352A),
                blurRadius: 40,
                offset: Offset(0, 18),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(28, 32, 28, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  '欢迎回来',
                  style: AppFonts.text(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    color: _ink,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 24),
                _Field(
                  label: '邮箱',
                  controller: _emailController,
                  focusNode: _emailFocusNode,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  hint: 'leslie@example.com',
                ),
                const SizedBox(height: 16),
                _Field(
                  label: '密码',
                  controller: _passwordController,
                  focusNode: _passwordFocusNode,
                  obscureText: _obscure,
                  textInputAction: TextInputAction.done,
                  suffix: IconButton(
                    tooltip: _obscure ? '显示密码' : '隐藏密码',
                    onPressed: () {
                      _obscure = !_obscure;
                      _sync();
                    },
                    style: IconButton.styleFrom(
                      splashFactory: NoSplash.splashFactory,
                      highlightColor: Colors.transparent,
                      hoverColor: const Color(0x0F20352A),
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    icon: CustomPaint(
                      size: const Size(22, 14),
                      painter: _PasswordEyePainter(
                        concealed: _obscure,
                        color: _muted,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 22),
                Material(
                  color: _green,
                  borderRadius: BorderRadius.circular(10),
                  child: InkWell(
                    onTap: () {},
                    borderRadius: BorderRadius.circular(10),
                    child: SizedBox(
                      height: 46,
                      child: Center(
                        child: Text(
                          '登录  →',
                          style: AppFonts.text(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  '欢迎回来，继续照顾好自己',
                  textAlign: TextAlign.center,
                  style: AppFonts.text(
                    fontSize: 13,
                    color: _muted,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _emailFocusNode.removeListener(_sync);
    _passwordFocusNode.removeListener(_sync);
    _emailFocusNode.dispose();
    _passwordFocusNode.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}

class LoginBrand extends StatelessWidget {
  const LoginBrand({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Image.asset('assets/images/logo.png', width: 40, height: 40),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Mise',
              style: AppFonts.text(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: _ink,
                height: 1.05,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              'KITCHEN JOURNAL',
              style: AppFonts.text(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                color: _muted,
                letterSpacing: 1.4,
                height: 1.1,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({
    required this.label,
    required this.controller,
    required this.focusNode,
    this.obscureText = false,
    this.keyboardType,
    this.textInputAction,
    this.hint,
    this.suffix,
  });

  final String label;
  final TextEditingController controller;
  final FocusNode focusNode;
  final bool obscureText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final String? hint;
  final Widget? suffix;

  @override
  Widget build(BuildContext context) {
    final focused = focusNode.hasFocus;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppFonts.text(fontSize: 13, color: const Color(0xFF5E6B66)),
        ),
        const SizedBox(height: 8),
        AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          curve: Curves.easeOut,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: focused ? _green : _line),
          ),
          child: TextField(
            controller: controller,
            focusNode: focusNode,
            obscureText: obscureText,
            keyboardType: keyboardType,
            textInputAction: textInputAction,
            cursorColor: _green,
            style: AppFonts.text(fontSize: 15, color: _ink, height: 1.3),
            decoration: InputDecoration(
              isDense: true,
              hintText: hint,
              hintStyle: AppFonts.text(fontSize: 15, color: _hint, height: 1.3),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              contentPadding: EdgeInsets.fromLTRB(
                14,
                13,
                suffix == null ? 14 : 4,
                13,
              ),
              suffixIcon: suffix,
              suffixIconConstraints: const BoxConstraints(
                minWidth: 40,
                minHeight: 36,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _PasswordEyePainter extends CustomPainter {
  const _PasswordEyePainter({required this.concealed, required this.color});

  final bool concealed;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final w = size.width;
    final h = size.height;
    final eye = Path()
      ..moveTo(w * 0.04, h * 0.50)
      ..cubicTo(w * 0.22, h * 0.08, w * 0.78, h * 0.08, w * 0.96, h * 0.50)
      ..cubicTo(w * 0.78, h * 0.92, w * 0.22, h * 0.92, w * 0.04, h * 0.50);
    canvas.drawPath(eye, stroke);
    canvas.drawCircle(
      Offset(w * 0.50, h * 0.50),
      h * 0.16,
      Paint()..color = color,
    );

    if (!concealed) {
      canvas.drawLine(
        Offset(w * 0.16, h * 0.84),
        Offset(w * 0.84, h * 0.16),
        stroke,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _PasswordEyePainter oldDelegate) {
    return oldDelegate.concealed != concealed || oldDelegate.color != color;
  }
}
