import 'package:cook_app/config/app_config.dart';
import 'package:talker_flutter/talker_flutter.dart';

final talker = TalkerFlutter.init(
  settings: TalkerSettings(
    enabled: AppConfig.logEnabled,
    useConsoleLogs: AppConfig.logConsoleEnabled,
  ),
);
