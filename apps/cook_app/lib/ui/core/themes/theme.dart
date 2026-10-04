import 'package:flutter/material.dart';

import 'colors.dart';

abstract final class AppFonts {
  static const family = 'PingFang SC';

  static const fallback = <String>[
    'Hiragino Sans GB',
    'Heiti SC',
    'Noto Sans SC',
    'Noto Sans CJK SC',
    'sans-serif',
  ];

  static TextStyle text({
    required double fontSize,
    FontWeight fontWeight = FontWeight.w400,
    Color color = const Color(0xFF1D1D1F),
    double? letterSpacing,
    double height = 1.2,
  }) {
    return TextStyle(
      fontFamily: family,
      fontFamilyFallback: fallback,
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
      letterSpacing: letterSpacing,
      height: height,
    );
  }
}

abstract class AppTheme {
  static const _textTheme = TextTheme(
    headlineLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.w500),
    headlineSmall: TextStyle(fontSize: 18, fontWeight: FontWeight.w400),
    titleMedium: TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
    bodyLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w400),
    bodyMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w400),
    bodySmall: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w400,
      color: AppColors.gray1,
    ),
    labelSmall: TextStyle(
      fontSize: 10,
      fontWeight: FontWeight.w500,
      color: AppColors.gray1,
    ),
    labelLarge: TextStyle(
      fontSize: 18,
      fontWeight: FontWeight.w400,
      color: AppColors.gray1,
    ),
  );

  static ThemeData lightTheme() => ThemeData(
    brightness: Brightness.light,
    colorScheme: AppColors.lightColorScheme,
    extensions: [AppExtraColors.light],
    textTheme: _textTheme,
    fontFamily: AppFonts.family,
    fontFamilyFallback: AppFonts.fallback,
  );
}
