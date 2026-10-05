import 'package:cook_app/ui/auth/login/view_models/login_view_model.dart';
import 'package:cook_app/ui/auth/login/widgets/gaze_bus.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:cook_app/ui/core/themes/theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

const _shadowAlpha = 0x14 / 0xFF;
const _hoverAlpha = 0x0F / 0xFF;

class LoginForm extends HookConsumerWidget {
  const LoginForm({super.key, required this.gazeBus, this.showBrand = true});

  final GazeBus gazeBus;
  final bool showBrand;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final obscure = useState(true);
    final emailController = useTextEditingController();
    final passwordController = useTextEditingController();
    final emailFocusNode = useFocusNode();
    final passwordFocusNode = useFocusNode();
    useListenable(emailFocusNode);
    useListenable(passwordFocusNode);
    final viewModel = ref.watch(loginViewModelProvider);
    final signingIn = viewModel.isSigningIn;
    final errorMessage = viewModel.errorMessage;

    useEffect(() {
      void sync() {
        var next = GazeMode.idle;
        if (passwordFocusNode.hasFocus) {
          next = obscure.value ? GazeMode.password : GazeMode.passwordVisible;
        } else if (emailFocusNode.hasFocus) {
          next = GazeMode.email;
        }
        gazeBus.mode.value = next;
      }

      emailFocusNode.addListener(sync);
      passwordFocusNode.addListener(sync);
      sync();
      return () {
        emailFocusNode.removeListener(sync);
        passwordFocusNode.removeListener(sync);
      };
    }, [emailFocusNode, passwordFocusNode, obscure.value, gazeBus]);

    final scheme = Theme.of(context).colorScheme;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (showBrand) ...const [LoginBrand(), SizedBox(height: 28)],
        DecoratedBox(
          decoration: BoxDecoration(
            color: scheme.surface,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: scheme.onSurface.withValues(alpha: _shadowAlpha),
                blurRadius: 40,
                offset: const Offset(0, 18),
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
                    color: scheme.onSurface,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 24),
                _Field(
                  label: '邮箱',
                  controller: emailController,
                  focusNode: emailFocusNode,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  hint: 'leslie@example.com',
                ),
                const SizedBox(height: 16),
                _Field(
                  label: '密码',
                  controller: passwordController,
                  focusNode: passwordFocusNode,
                  obscureText: obscure.value,
                  textInputAction: TextInputAction.done,
                  suffix: IconButton(
                    tooltip: obscure.value ? '显示密码' : '隐藏密码',
                    onPressed: () => obscure.value = !obscure.value,
                    style: IconButton.styleFrom(
                      splashFactory: NoSplash.splashFactory,
                      highlightColor: Colors.transparent,
                      hoverColor: scheme.onSurface.withValues(
                        alpha: _hoverAlpha,
                      ),
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    icon: CustomPaint(
                      size: const Size(22, 14),
                      painter: _PasswordEyePainter(
                        concealed: obscure.value,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 22),
                Material(
                  color: signingIn
                      ? scheme.primary.withValues(alpha: 0.7)
                      : scheme.primary,
                  borderRadius: BorderRadius.circular(10),
                  child: InkWell(
                    onTap: signingIn
                        ? null
                        : () {
                            viewModel.signIn(
                              emailController.text,
                              passwordController.text,
                            );
                          },
                    borderRadius: BorderRadius.circular(10),
                    child: SizedBox(
                      height: 46,
                      child: Center(
                        child: signingIn
                            ? SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: scheme.onPrimary,
                                ),
                              )
                            : Text(
                                '登录  →',
                                style: AppFonts.text(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: scheme.onPrimary,
                                ),
                              ),
                      ),
                    ),
                  ),
                ),
                if (errorMessage != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    errorMessage,
                    textAlign: TextAlign.center,
                    style: AppFonts.text(fontSize: 13, color: scheme.error),
                  ),
                ],
                const SizedBox(height: 20),
                Text(
                  '欢迎回来，继续照顾好自己',
                  textAlign: TextAlign.center,
                  style: AppFonts.text(
                    fontSize: 13,
                    color: scheme.onSurfaceVariant,
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
}

class LoginBrand extends StatelessWidget {
  const LoginBrand({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
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
                color: scheme.onSurface,
                height: 1.05,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              'KITCHEN JOURNAL',
              style: AppFonts.text(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                color: scheme.onSurfaceVariant,
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
    final scheme = Theme.of(context).colorScheme;
    final extra = AppExtraColors.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppFonts.text(fontSize: 13, color: extra.fieldLabel),
        ),
        const SizedBox(height: 8),
        AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          curve: Curves.easeOut,
          decoration: BoxDecoration(
            color: scheme.surface,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: focused ? scheme.primary : scheme.outline,
            ),
          ),
          child: TextField(
            controller: controller,
            focusNode: focusNode,
            obscureText: obscureText,
            keyboardType: keyboardType,
            textInputAction: textInputAction,
            cursorColor: scheme.primary,
            style: AppFonts.text(
              fontSize: 15,
              color: scheme.onSurface,
              height: 1.3,
            ),
            decoration: InputDecoration(
              isDense: true,
              hintText: hint,
              hintStyle: AppFonts.text(
                fontSize: 15,
                color: extra.hint,
                height: 1.3,
              ),
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
