import 'package:flutter/material.dart';

abstract final class AppColors {
  static const black1 = Color(0xFF1A1A1A);
  static const white1 = Color(0xFFFFFFFF);
  static const gray1 = Color(0xFF737373);
  static const green1 = Color(0xFFB9F8CF);
  static const green2 = Color(0xFF5EE9B5);
  static const green3 = Color(0xFF00BC7D);
  static const green4 = Color(0xFF009966);
  static const amber1 = Color(0xFFFFEDD4);
  static const amber2 = Color(0xFFFFD6A7);
  static const blue1 = Color(0xFFB8E6FE);
  static const blue2 = Color(0xFF8EC5FF);
  static const red1 = Color(0xFFFF2056);

  /// Login and brand text. Greener than [black1].
  static const ink = Color(0xFF20352A);

  /// Login primary action. Distinct from [green4].
  static const brandGreen = Color(0xFF168553);

  static const muted = Color(0xFF7D8B84);
  static const line = Color(0xFFD9E0DB);
  static const hint = Color(0xFFA3ADA8);
  static const fieldLabel = Color(0xFF5E6B66);

  /// Character body fill. Not a [ColorScheme] role.
  static const coral1 = Color(0xFFE36D5C);

  static const lightColorScheme = ColorScheme(
    brightness: Brightness.light,
    primary: brandGreen,
    onPrimary: white1,
    primaryContainer: green1,
    onPrimaryContainer: green4,
    secondary: amber2,
    onSecondary: black1,
    secondaryContainer: amber1,
    onSecondaryContainer: black1,
    tertiary: blue2,
    onTertiary: black1,
    tertiaryContainer: blue1,
    onTertiaryContainer: black1,
    error: red1,
    onError: white1,
    surface: white1,
    onSurface: ink,
    onSurfaceVariant: muted,
    outline: line,
  );
}

@immutable
class AppExtraColors extends ThemeExtension<AppExtraColors> {
  const AppExtraColors({
    required this.primaryMuted,
    required this.primaryEmphasized,
    required this.hint,
    required this.fieldLabel,
  });

  final Color primaryMuted;
  final Color primaryEmphasized;
  final Color hint;
  final Color fieldLabel;

  static const light = AppExtraColors(
    primaryMuted: AppColors.green2,
    primaryEmphasized: AppColors.green3,
    hint: AppColors.hint,
    fieldLabel: AppColors.fieldLabel,
  );

  static AppExtraColors of(BuildContext context) {
    final extra = Theme.of(context).extension<AppExtraColors>();
    assert(
      extra != null,
      'AppExtraColors is missing from ThemeData.extensions',
    );
    return extra!;
  }

  @override
  AppExtraColors copyWith({
    Color? primaryMuted,
    Color? primaryEmphasized,
    Color? hint,
    Color? fieldLabel,
  }) {
    return AppExtraColors(
      primaryMuted: primaryMuted ?? this.primaryMuted,
      primaryEmphasized: primaryEmphasized ?? this.primaryEmphasized,
      hint: hint ?? this.hint,
      fieldLabel: fieldLabel ?? this.fieldLabel,
    );
  }

  @override
  AppExtraColors lerp(
    covariant ThemeExtension<AppExtraColors>? other,
    double t,
  ) {
    if (other is! AppExtraColors) {
      return this;
    }

    return AppExtraColors(
      primaryMuted: Color.lerp(primaryMuted, other.primaryMuted, t)!,
      primaryEmphasized: Color.lerp(
        primaryEmphasized,
        other.primaryEmphasized,
        t,
      )!,
      hint: Color.lerp(hint, other.hint, t)!,
      fieldLabel: Color.lerp(fieldLabel, other.fieldLabel, t)!,
    );
  }
}
