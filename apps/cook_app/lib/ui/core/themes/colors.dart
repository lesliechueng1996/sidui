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

  static const lightColorScheme = ColorScheme(
    brightness: Brightness.light,
    primary: green4,
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
    onSurface: black1,
    onSurfaceVariant: gray1,
  );
}

@immutable
class AppExtraColors extends ThemeExtension<AppExtraColors> {
  const AppExtraColors({
    required this.primaryMuted,
    required this.primaryEmphasized,
  });

  final Color primaryMuted;
  final Color primaryEmphasized;

  static const light = AppExtraColors(
    primaryMuted: AppColors.green2,
    primaryEmphasized: AppColors.green3,
  );

  @override
  ThemeExtension<AppExtraColors> copyWith() {
    return AppExtraColors(
      primaryMuted: primaryMuted,
      primaryEmphasized: primaryEmphasized,
    );
  }

  @override
  ThemeExtension<AppExtraColors> lerp(
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
    );
  }
}
