# 登录页角色动画

未登录时路由会进 `LoginScreen`。在 `apps/cook_app` 里用桌面或浏览器跑，鼠标追随才看得到：

```bash
cd apps/cook_app
flutter run -d chrome
```

窗口宽度 **大于等于 900** 是桌面，更窄是手机。每步做完热重载看一眼。改过 `initState`、混入的 mixin、或 `Ticker` / `AnimationController` 的创建，要热重启（终端里按 `R`）。热重载不会重新执行已经创建过的 `State.initState`。

## 怎么用这份文档

每一步下面的源码，是**这一步结束时、有改动的文件的完整内容**。直接整份替换对应文件。没列出来的文件保持上一步，不要改。

不要把上一步的片段和新的一段拼在一起。走散了，用当前这一步的文件覆盖，再继续。第 11 步的文件就是最终结果，文末没有第二份总代码。

这些文件都在 `lib/ui/auth/login/widgets/`。import 用 `package:cook_app/...`，和 app 里现有文件一致。

| 文件 | 第几步出现 | 之后还要整份替换的步骤 |
|---|---|---|
| `login_screen.dart` | 1 | 2、3、4、5、8、10 |
| `cook_character.dart` | 2 | 3、7、9 |
| `character_stage.dart` | 4 | 5、6、7、8、9、10、11 |
| `gaze_bus.dart` | 5 | 不再改 |
| `login_form.dart` | 8 | 不再改 |

数据只往一个方向走：表单把焦点写进 `GazeBus.mode`，页面把鼠标写进 `GazeBus.look`，舞台读这两个值。表单不听 `look`，所以鼠标一动，输入框不会重绘。

```text
MouseRegion ──look──▶ GazeBus ◀──mode── FocusNode
                         │
                         ▼
                  CharacterStage
                    ├ 追踪 Ticker（平滑看点）
                    └ AnimationController（闭眼 / 抬手 / 进场）
                         │
                         ▼
                    CookCharacter × 3
```

## 你会碰到的组件

| 步 | 组件 / API | 做完能看到 |
|---|---|---|
| 1 | `LayoutBuilder`、`Row`、`Column` | 左舞台、右表单区域；窄屏改成上下 |
| 2 | `DecoratedBox`、`BorderRadius` | 方底、圆顶的一个角色 |
| 3 | `Stack`、`ClipOval`、`Align` | 眼睛和瞳孔 |
| 4 | `Positioned`、`Rect` | 三个不同高矮的角色站在地面上 |
| 5 | `MouseRegion`、`ValueNotifier` | 鼠标坐标在变，表单不跟着重建 |
| 6 | `Ticker`、`Offset.lerp` | 瞳孔平滑跟着走 |
| 7 | `Transform.rotate` | 身体慢慢侧过去 |
| 8 | `FocusNode`、`TextField` | 焦点决定现在是邮箱还是密码 |
| 9 | `AnimationController` | 闭眼、抬手，三人有先后 |
| 10 | `Stack` 叠在表单上 | 手机上只露出头，趴在卡片上沿 |
| 11 | `Timer`、`MediaQuery.disableAnimationsOf` | 偶尔眨眼；系统关掉动画时静止 |

---

## 第 1 步：用宽度分成两种布局

做完能看到：宽窗口左边一整块浅绿，右边白条；把窗口拉到 900 以下，浅绿变成顶部一条，下面是白。

这一步只替换 `login_screen.dart`。

### LayoutBuilder 给你的是父组件的约束，不是屏幕尺寸

Flutter 布局时，父组件先把自己的 `BoxConstraints` 传给子组件。约束有四个数：`minWidth`、`maxWidth`、`minHeight`、`maxHeight`。

`Scaffold` 的 body 在没有 AppBar 时，拿到的就是整块窗口。`LayoutBuilder` 把这份约束原样交给 `builder`。这里用 `constraints.maxWidth >= 900` 区分桌面和手机。正好 900 算桌面。

不要用 `MediaQuery.sizeOf(context).width` 来做这件事。`MediaQuery` 是整窗的逻辑像素，不会因为这块 body 外面又包了一层而变小。`LayoutBuilder` 量的是**这一层实际能用的宽**。

### Row / Column 的主轴和交叉轴

`Row` 的主轴是水平，交叉轴是垂直。`Column` 反过来。

`Expanded` 只能放在 `Row` 或 `Column` 里。它吃掉主轴上**还没被固定子组件占掉**的空间。

假设窗口是 1200×800：

- 右侧 `SizedBox(width: 460)` 先占掉 460
- 左侧 `Expanded` 得到紧约束：宽正好 `1200 - 460 = 740`，高是整行的高

右侧用固定宽度，表单以后才不会被拉得满屏。左侧用 `Expanded`，舞台跟着窗口变。

窄屏时顶部 `SizedBox(height: 120)` 占掉 120，下面的 `Expanded` 吃掉剩余高度。

### 为什么必须 stretch

`crossAxisAlignment` 的默认值是 `CrossAxisAlignment.center`。这时交叉轴是**松约束**：最小是 0，最大是父组件给的最大尺寸。

`ColoredBox` 没有子组件时，它的 RenderObject 会把自己的尺寸设成 `constraints.smallest`。交叉轴最小是 0，于是高度（在 `Row` 里）或宽度（在 `Column` 里）变成 0，屏幕看起来是空白。

`CrossAxisAlignment.stretch` 把交叉轴收成**紧约束**：最小等于最大。窗口高 800 时，`Row` 的每个子组件都拿到「高度必须是 800」。`constraints.smallest` 的高度也是 800，色块就铺满那一条边。

圆角、颜色都不参与这个计算。这一步先只确认拉窗口会切换，角色放到第 2 步。

### 源码：`login_screen.dart`

```dart
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white1,
      body: LayoutBuilder(
        builder: (context, constraints) {
          final desktop = constraints.maxWidth >= 900;
          if (desktop) {
            return const Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(child: ColoredBox(color: AppColors.green1)),
                SizedBox(
                  width: 460,
                  child: ColoredBox(color: AppColors.white1),
                ),
              ],
            );
          }
          return const Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(
                height: 120,
                child: ColoredBox(color: AppColors.green1),
              ),
              Expanded(child: ColoredBox(color: AppColors.white1)),
            ],
          );
        },
      ),
    );
  }
}
```

热重载即可。右边和 `Scaffold` 都是白色，分界就靠左边那块绿。

---

## 第 2 步：一个角色就是一个圆角盒子

做完能看到：桌面左侧正中有一个绿色角色，顶上是半圆，下面是直边，脚是平的。窄屏这一步仍是色块。

替换 `cook_character.dart`（新建）和 `login_screen.dart`。

### 宽是 w，高是 h

角色宽 `w`，高 `h`。两个数分开传。代码里的参数叫 `width` 和 `height`，下面用 `w` 和 `h` 称呼它们。`h` 不是从 `w` 乘出来的，不要写 `width * 1.5`。

顶部圆角半径是 `w / 2`。弧的直径等于宽度，所以头顶是半圆。半圆的高度是 `w / 2`，只跟 `w` 有关。`h` 要比 `w / 2` 大，半圆下面才有一段直边。直边的高度是 `h - w / 2`。底部半径是 0，脚是平的，后面才能踩在地面线上。

这一步取 `w = 108`、`h = 162`。半圆占上面 54 像素，下面 `162 - 54 = 108` 像素是矩形。下面这 108 是减出来的，不是另一条「高度等于宽度」的规则。

`BorderRadius` 只影响绘制，不改变布局尺寸。布局尺寸由外面的 `SizedBox(width: w, height: h)` 决定。

### DecoratedBox 自己不发明尺寸

`DecoratedBox` 和 `ColoredBox` 一样，没有子组件时会缩到 `constraints.smallest`。外面的 `SizedBox` 把约束收紧成「宽必须是 `w`，高必须是 `h`」，装饰盒子才会长成这个形状。

不要用 `Container` 包一层再设颜色。`Container` 是 `DecoratedBox`、`Padding`、`Align` 等的组合，这里只需要一块带圆角的颜色，`DecoratedBox` 够用。

### 眼睛的几何先写在一处

这一步还没画眼睛，但眼睛的位置已经定下来。眼睛长在头顶的半圆里，所以位置跟 `w` 走，不跟 `h` 走。把 `h` 改高或改矮，眼睛不会挪到身体中间。舞台第 6 步算「看向哪里」时，用的必须是绘制眼睛时的同一个点。两套数字一旦分开，瞳孔会朝错误的方向偏。

四个比例：

| 量 | 比例 | `w = 108` 时 |
|---|---|---|
| 眼睛边长 | `0.22w` | 23.8 |
| 眼睛顶边，距角色顶 | `0.16w` | 17.3 |
| 左眼左边 | `0.22w` | 23.8 |
| 右眼左边 | `0.56w` | 60.5 |

眼睛底边在 `0.16w + 0.22w = 0.38w`。半圆结束在 `0.5w`。`0.38 < 0.5`，整只眼睛都在半圆里面，还没进到下面的矩形。`w = 108` 时，眼睛底边大约在 y = 41，半圆结束在 y = 54。

`eyeCenterInBody` 返回的是**角色左上角为原点**的两眼中点，不是舞台坐标。左眼中心 x 是 `左 + 边长 / 2`，右眼同样，再取平均；y 是 `顶 + 边长 / 2`。

### 源码：`cook_character.dart`

```dart
import 'package:flutter/material.dart';

abstract final class CookCharacterMetrics {
  static double eyeSizeOf(double width) => width * 0.22;

  static double eyeTopOf(double width) => width * 0.16;

  static double eyeLeftOf(double width) => width * 0.22;

  static double eyeRightOf(double width) => width * 0.56;

  /// Eye center, measured from the top-left of the character.
  static Offset eyeCenterInBody(double width) {
    final eye = eyeSizeOf(width);
    final midX =
        (eyeLeftOf(width) + eye / 2 + eyeRightOf(width) + eye / 2) / 2;
    return Offset(midX, eyeTopOf(width) + eye / 2);
  }
}

class CookCharacter extends StatelessWidget {
  const CookCharacter({
    required this.color,
    required this.width,
    required this.height,
    super.key,
  });

  final Color color;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(width / 2),
          ),
        ),
      ),
    );
  }
}
```

### 源码：`login_screen.dart`

桌面左侧用 `Center` 放一个宽 108 的绿色角色。窄屏先不动。

```dart
import 'package:cook_app/ui/auth/login/widgets/cook_character.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white1,
      body: LayoutBuilder(
        builder: (context, constraints) {
          final desktop = constraints.maxWidth >= 900;
          if (desktop) {
            return const Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: ColoredBox(
                    color: AppColors.green1,
                    child: Center(
                      child: CookCharacter(
                        color: AppColors.green3,
                        width: 108,
                        height: 162,
                      ),
                    ),
                  ),
                ),
                SizedBox(
                  width: 460,
                  child: ColoredBox(color: AppColors.white1),
                ),
              ],
            );
          }
          return const Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(
                height: 120,
                child: ColoredBox(color: AppColors.green1),
              ),
              Expanded(child: ColoredBox(color: AppColors.white1)),
            ],
          );
        },
      ),
    );
  }
}
```

热重载即可。

---

## 第 3 步：眼睛

做完能看到：半圆里有两只眼睛，瞳孔在正中。把调用处的 `eyeOpen` 临时改成 `0`，眼睛会被身体颜色盖住；确认眼皮在最上层之后改回 `1`。

替换 `cook_character.dart` 和 `login_screen.dart`。

### Stack：后面的孩子画在上面

角色内部是一个 `Stack`。`SizedBox` 已经把宽高定死，Stack 会撑满这块紧约束。

这一步三个孩子都是 `Positioned`（身体用 `Positioned.fill`）。Stack 的规则是：

- 有**没被 Positioned 的**孩子时，Stack 尽量包住那些孩子
- **全部都是 Positioned** 时，Stack 尽量撑满父约束

所以身体必须 `Positioned.fill`，否则 Stack 不知道自己该多大，眼睛的百分比也没有参照。

列表里的顺序就是绘制顺序。眼白在最下，瞳孔在中间，眼皮在最上。眼皮后画，才能盖住瞳孔。

`clipBehavior` 这一步用默认的 `Clip.hardEdge` 就行。第 9 步手会画出身体矩形，那时再改成 `Clip.none`。

### ClipOval、Align、Alignment

一只眼睛是一个正方形，`ClipOval` 把它裁成圆。裁剪只影响绘制，孩子仍按正方形布局。

瞳孔不是用 `Positioned(left: ..., top: ...)` 去写像素。它放在 `Align` 里，对齐方式是 `Alignment(x, y)`：

- `-1` 是左 / 上
- `0` 是中心
- `1` 是右 / 下

`Alignment(1, 0)` 的意思是：把**孩子的右中点**对准**父组件的右中点**。瞳孔是眼睛的 42%（`FractionallySizedBox` 的 `widthFactor` / `heightFactor`），所以它会贴在眼白右边，但整个圆还在眼睛里面。`Alignment(0, 0)` 就是正中。

后面算出来的瞳孔偏移直接填进这个 `-1 ~ 1`。不要再乘一次眼睛的像素大小，否则会飞出 `ClipOval`。

`FractionallySizedBox` 的系数是相对**父组件**的。这里的父组件是那只被 `ClipOval` 撑满的眼睛，所以 `0.42` 就是眼白直径的 42%。

### 眼皮

眼皮是一个顶对齐的 `FractionallySizedBox`，高度系数是 `(1 - eyeOpen).clamp(0, 1)`。

- `eyeOpen = 1`：系数 0，眼皮高度为 0，眼睛全开
- `eyeOpen = 0`：系数 1，眼皮盖满，颜色和身体一样，看起来像没长眼睛
- `eyeOpen = 0.38`：从上往下盖住 62%

`clamp` 是因为后面的曲线有可能略微超出 0 到 1，`FractionallySizedBox` 的系数越界会出问题。

两只眼睛用**同一个** `pupil`。如果分别朝鼠标算，鼠标离脸很近时两只眼的方向会差很多，变成斗鸡眼。远看时差别很小，近看才明显，所以从一开始就共用。

眼睛的 `left` / `top` 走 `CookCharacterMetrics`，不要在这里再写 `0.16`、`0.22`、`0.56`。

### 源码：`cook_character.dart`

```dart
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

abstract final class CookCharacterMetrics {
  static double eyeSizeOf(double width) => width * 0.22;

  static double eyeTopOf(double width) => width * 0.16;

  static double eyeLeftOf(double width) => width * 0.22;

  static double eyeRightOf(double width) => width * 0.56;

  /// Eye center, measured from the top-left of the character.
  static Offset eyeCenterInBody(double width) {
    final eye = eyeSizeOf(width);
    final midX =
        (eyeLeftOf(width) + eye / 2 + eyeRightOf(width) + eye / 2) / 2;
    return Offset(midX, eyeTopOf(width) + eye / 2);
  }
}

class CookCharacter extends StatelessWidget {
  const CookCharacter({
    required this.color,
    required this.width,
    required this.height,
    required this.pupil,
    required this.eyeOpen,
    super.key,
  });

  final Color color;
  final double width;
  final double height;
  final Offset pupil;
  final double eyeOpen;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height,
      child: Stack(
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
    );
  }

  Widget _eye(double left) {
    final size = CookCharacterMetrics.eyeSizeOf(width);
    return Positioned(
      left: left,
      top: CookCharacterMetrics.eyeTopOf(width),
      width: size,
      height: size,
      child: _Eye(pupil: pupil, eyeOpen: eyeOpen, lidColor: color),
    );
  }
}

class _Eye extends StatelessWidget {
  const _Eye({
    required this.pupil,
    required this.eyeOpen,
    required this.lidColor,
  });

  final Offset pupil;
  final double eyeOpen;
  final Color lidColor;

  @override
  Widget build(BuildContext context) {
    return ClipOval(
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
              heightFactor: (1 - eyeOpen).clamp(0.0, 1.0),
              child: ColoredBox(color: lidColor),
            ),
          ),
        ],
      ),
    );
  }
}
```

`StackFit.expand` 让眼睛内部这个 Stack 的非定位孩子撑满眼睛正方形。眼白没有 `Positioned`，靠这个撑满；瞳孔和眼皮是 `Align`，在撑满之后的正方形里对齐。

### 源码：`login_screen.dart`

只给角色补上 `pupil` 和 `eyeOpen`。其余和第 2 步相同。

```dart
import 'package:cook_app/ui/auth/login/widgets/cook_character.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white1,
      body: LayoutBuilder(
        builder: (context, constraints) {
          final desktop = constraints.maxWidth >= 900;
          if (desktop) {
            return const Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: ColoredBox(
                    color: AppColors.green1,
                    child: Center(
                      child: CookCharacter(
                        color: AppColors.green3,
                        width: 108,
                        height: 162,
                        pupil: Offset.zero,
                        eyeOpen: 1,
                      ),
                    ),
                  ),
                ),
                SizedBox(
                  width: 460,
                  child: ColoredBox(color: AppColors.white1),
                ),
              ],
            );
          }
          return const Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(
                height: 120,
                child: ColoredBox(color: AppColors.green1),
              ),
              Expanded(child: ColoredBox(color: AppColors.white1)),
            ],
          );
        },
      ),
    );
  }
}
```

热重载即可。确认眼皮之后，`eyeOpen` 必须是 `1` 再进入下一步。

---

## 第 4 步：三个角色站到地面上

做完能看到：桌面浅绿区域里，三个不同高度的角色水平居中，脚踩在同一条地面线上。窄屏顶部 220 像素的绿区里，三个缩小的角色脚贴着这块区域的底边。

新建 `character_stage.dart`，替换 `login_screen.dart`。`cook_character.dart` 不动。

三个规格。宽是 `w`，高是 `h`，手机另有一套更小的 `w` 和 `h`。高矮是数据里写死的，不是 `w` 乘一个系数。`lag` 和手留到第 6、第 9 步再用，这一步数据里先不放，避免出现还用不上的字段。

| | 颜色 | 桌面 `w` | 桌面 `h` | 手机 `w` | 手机 `h` |
|---|---|---|---|---|---|
| 左 | `AppColors.green3` | 108 | 162 | 52 | 78 |
| 中 | `AppColors.amber2` | 78 | 117 | 40 | 60 |
| 右 | `AppColors.blue2` | 92 | 138 | 46 | 69 |

### 舞台自己再量一次

登录页的 `LayoutBuilder` 决定左右还是上下。舞台内部还要知道**自己**有多高，才能把脚放在高度的 72% 处。所以 `CharacterStage` 再套一个 `LayoutBuilder`。外层那个不知道舞台被 `Expanded` 分到了多少。

`Rect.fromLTWH(x, top, width, height)` 是左、上、宽、高。`Positioned` 使用矩形的这四个字段，把每个角色放进 `Stack`。

舞台 `Stack` 的 `clipBehavior` 设成 `Clip.none`。默认会把画出边界的部分裁掉。第 7 步身体会歪出矩形，第 9 步手会伸到身体外面，第 11 步进场会从矩形外飘进来。

### 地面线

桌面：

```text
ground = 舞台高度 × 0.72
top    = ground - 角色高度
```

窗口高 800、舞台也差不多 800 时，地面在 y = 576。左边绿色的 `h` 是 162，顶在 y = 414，底在 y = 576。三个角色的底相同，谁的 `h` 小，头就更低，不是顶对齐。

水平方向先算整组宽度：三个 `w` 加两段间距 28。`108 + 78 + 92 + 28 × 2 = 334`。起始 x 是 `(舞台宽 - 334) / 2`，整组居中。然后每放一个，`x += width + 28`。高度不参与这一行的居中。

手机这一步是临时摆法：用表里那组更小的 `w` 和 `h`，`top = 舞台高度 - h`，脚贴着绿色区域的底。趴在表单上沿是第 10 步，这一步不要做。

`fold` 的初值写成 `0.0`。写成 `0` 时类型是 `int`，`fold<double>` 会报类型错误。

### 源码：`character_stage.dart`

```dart
import 'package:cook_app/ui/auth/login/widgets/cook_character.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

class _Buddy {
  const _Buddy({
    required this.color,
    required this.width,
    required this.height,
    required this.compactWidth,
    required this.compactHeight,
  });

  final Color color;
  final double width;
  final double height;
  final double compactWidth;
  final double compactHeight;
}

const _buddies = [
  _Buddy(
    color: AppColors.green3,
    width: 108,
    height: 162,
    compactWidth: 52,
    compactHeight: 78,
  ),
  _Buddy(
    color: AppColors.amber2,
    width: 78,
    height: 117,
    compactWidth: 40,
    compactHeight: 60,
  ),
  _Buddy(
    color: AppColors.blue2,
    width: 92,
    height: 138,
    compactWidth: 46,
    compactHeight: 69,
  ),
];

class CharacterStage extends StatelessWidget {
  const CharacterStage({required this.compact, super.key});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final size = Size(constraints.maxWidth, constraints.maxHeight);
        final rects = _bodies(size);
        return Stack(
          clipBehavior: Clip.none,
          children: [
            for (var i = 0; i < rects.length; i++)
              Positioned(
                left: rects[i].left,
                top: rects[i].top,
                width: rects[i].width,
                height: rects[i].height,
                child: CookCharacter(
                  color: _buddies[i].color,
                  width: rects[i].width,
                  height: rects[i].height,
                  pupil: Offset.zero,
                  eyeOpen: 1,
                ),
              ),
          ],
        );
      },
    );
  }

  List<Rect> _bodies(Size size) {
    const gap = 28.0;
    final total = _buddies.fold<double>(0.0, (sum, buddy) {
          final width = compact ? buddy.compactWidth : buddy.width;
          return sum + width;
        }) +
        gap * (_buddies.length - 1);
    var x = (size.width - total) / 2;
    final rects = <Rect>[];
    for (final buddy in _buddies) {
      final width = compact ? buddy.compactWidth : buddy.width;
      final height = compact ? buddy.compactHeight : buddy.height;
      final top = compact
          ? size.height - height
          : size.height * 0.72 - height;
      rects.add(Rect.fromLTWH(x, top, width, height));
      x += width + gap;
    }
    return rects;
  }
}
```

### 源码：`login_screen.dart`

左侧整块交给舞台。窄屏把绿色区域加高到 220，放缩小的舞台，下面仍是空白。

```dart
import 'package:cook_app/ui/auth/login/widgets/character_stage.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white1,
      body: LayoutBuilder(
        builder: (context, constraints) {
          final desktop = constraints.maxWidth >= 900;
          if (desktop) {
            return const Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: ColoredBox(
                    color: AppColors.green1,
                    child: CharacterStage(compact: false),
                  ),
                ),
                SizedBox(
                  width: 460,
                  child: ColoredBox(color: AppColors.white1),
                ),
              ],
            );
          }
          return const Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(
                height: 220,
                child: ColoredBox(
                  color: AppColors.green1,
                  child: CharacterStage(compact: true),
                ),
              ),
              Expanded(child: ColoredBox(color: AppColors.white1)),
            ],
          );
        },
      ),
    );
  }
}
```

热重载即可。单个角色的 `Center` 从这一步起不再使用。

---

## 第 5 步：鼠标位置放进 ValueNotifier

做完能看到：舞台左上角有一行数字。鼠标在窗口里移动，数字跟着变；移出窗口，第二行变成 `inside=false`。拖动时右侧白块不闪、不重建。确认之后进入第 6 步，那里会删掉这行字。

新建 `gaze_bus.dart`。替换 `login_screen.dart` 和 `character_stage.dart`。

### 为什么不是 setState

如果在 `LoginScreen` 里 `setState` 存鼠标，每一次移动都会执行整个 `LoginScreen.build`。右侧表单、两个输入框、按钮全部跟着重建。鼠标一秒钟可以进来几十次，输入会卡。

`ValueNotifier<T>` 是一个带监听列表的盒子。给 `.value` 赋一个**新值**（`==` 比较后不相同）时，它通知监听者。没有监听者，赋值就只是改了一个字段，不会重建任何 Widget。

`ValueListenableBuilder` 自己是一个 `StatefulWidget`，在 `initState` 里订阅，在 `dispose` 里取消。只有它的 `builder` 会重建。这一步用它把坐标打在舞台角落，影响范围就是那一行 `Text`。

`GazeBus` 不是 Widget，也不要在 `build` 里 `GazeBus()`。`build` 会反复执行，每次都会造一个新总线，舞台拿到的是旧的那个。把它放在 `State` 的字段里，和 `State` 活得一样久，在 `dispose` 里释放三个 notifier。

页面持有总线，是因为鼠标在页面层（`MouseRegion` 包住左右两边），第 8 步的表单也要写 `mode`。舞台只读，不拥有。

### MouseRegion 和两套坐标

`MouseRegion` 包住整个 body，不要只包左侧。

- `onHover`：指针在区域内移动时调用。`event.position` 是**全局坐标**，原点在屏幕（更准确说是 Flutter 视图）左上角，不是舞台左上角。
- `event.localPosition` 是相对这个 `MouseRegion` 自己的盒子。这个盒子是整块 body，包括右侧白条，所以即使用 local，原点也不是舞台。
- `onEnter` / `onExit`：进入或离开这块区域。用来区分「指针还在窗口里」和「已经出去了」。出去之后 `look` 停在最后一次的位置，不能靠坐标本身判断人还在不在。

子组件（以后的输入框）不会吃掉父级 `MouseRegion` 的 hover。指针在右侧时，外层的 `onHover` 仍会进来。如果只包左侧，鼠标一去填表单就会 `onExit`，角色会以为人离开了。

舞台要的是自己左上角为原点的坐标。转换留到第 6 步：拿到舞台的 `RenderBox`，调用 `globalToLocal`。这一步先确认全局坐标在变。

`onHover` 里把 `pointerInside` 再写成 `true`，是因为有的平台上进入和移动的顺序不稳定，移动时顺手标成「在里面」更稳。

### 舞台这一步仍是 StatelessWidget

坐标文字用 `ValueListenableBuilder` 自己订阅。`CharacterStage` 还不用变成 `StatefulWidget`。第 6 步要持有 `Ticker`，才会改成 `State`。

### 源码：`gaze_bus.dart`

```dart
import 'package:flutter/foundation.dart';

enum GazeMode { idle, email, password, passwordVisible }

/// Pointer position and which field is focused.
///
/// The form writes [mode]. The screen writes [look].
/// The stage reads both. The form does not listen to [look].
class GazeBus {
  final look = ValueNotifier<Offset>(Offset.zero);
  final pointerInside = ValueNotifier<bool>(false);
  final mode = ValueNotifier<GazeMode>(GazeMode.idle);

  void dispose() {
    look.dispose();
    pointerInside.dispose();
    mode.dispose();
  }
}
```

`ValueNotifier` 在 `foundation.dart` 里，`material.dart` 也会导出它。这里只建数据，不引入 Material。`Offset` 同样来自 foundation。

### 源码：`login_screen.dart`

从这一步起 `LoginScreen` 是 `StatefulWidget`。改的是 `initState` 所在的类从无到有，**热重启**。

```dart
import 'package:cook_app/ui/auth/login/widgets/character_stage.dart';
import 'package:cook_app/ui/auth/login/widgets/gaze_bus.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _bus = GazeBus();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white1,
      body: LayoutBuilder(
        builder: (context, constraints) {
          final desktop = constraints.maxWidth >= 900;
          return MouseRegion(
            onEnter: (_) => _bus.pointerInside.value = true,
            onExit: (_) => _bus.pointerInside.value = false,
            onHover: (event) {
              _bus.pointerInside.value = true;
              _bus.look.value = event.position;
            },
            child: desktop ? _desktop() : _mobile(),
          );
        },
      ),
    );
  }

  Widget _desktop() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: ColoredBox(
            color: AppColors.green1,
            child: CharacterStage(bus: _bus, compact: false),
          ),
        ),
        const SizedBox(
          width: 460,
          child: ColoredBox(color: AppColors.white1),
        ),
      ],
    );
  }

  Widget _mobile() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 220,
          child: ColoredBox(
            color: AppColors.green1,
            child: CharacterStage(bus: _bus, compact: true),
          ),
        ),
        const Expanded(child: ColoredBox(color: AppColors.white1)),
      ],
    );
  }

  @override
  void dispose() {
    _bus.dispose();
    super.dispose();
  }
}
```

### 源码：`character_stage.dart`

角落里的字只为这一步。第 6 步的文件里没有它。

```dart
import 'package:cook_app/ui/auth/login/widgets/cook_character.dart';
import 'package:cook_app/ui/auth/login/widgets/gaze_bus.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

class _Buddy {
  const _Buddy({
    required this.color,
    required this.width,
    required this.height,
    required this.compactWidth,
    required this.compactHeight,
  });

  final Color color;
  final double width;
  final double height;
  final double compactWidth;
  final double compactHeight;
}

const _buddies = [
  _Buddy(
    color: AppColors.green3,
    width: 108,
    height: 162,
    compactWidth: 52,
    compactHeight: 78,
  ),
  _Buddy(
    color: AppColors.amber2,
    width: 78,
    height: 117,
    compactWidth: 40,
    compactHeight: 60,
  ),
  _Buddy(
    color: AppColors.blue2,
    width: 92,
    height: 138,
    compactWidth: 46,
    compactHeight: 69,
  ),
];

class CharacterStage extends StatelessWidget {
  const CharacterStage({
    required this.bus,
    required this.compact,
    super.key,
  });

  final GazeBus bus;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final size = Size(constraints.maxWidth, constraints.maxHeight);
        final rects = _bodies(size);
        return Stack(
          clipBehavior: Clip.none,
          children: [
            for (var i = 0; i < rects.length; i++)
              Positioned(
                left: rects[i].left,
                top: rects[i].top,
                width: rects[i].width,
                height: rects[i].height,
                child: CookCharacter(
                  color: _buddies[i].color,
                  width: rects[i].width,
                  height: rects[i].height,
                  pupil: Offset.zero,
                  eyeOpen: 1,
                ),
              ),
            Positioned(
              left: 12,
              top: 12,
              child: ValueListenableBuilder<Offset>(
                valueListenable: bus.look,
                builder: (context, look, _) {
                  return ValueListenableBuilder<bool>(
                    valueListenable: bus.pointerInside,
                    builder: (context, inside, _) {
                      return Text(
                        '${look.dx.toStringAsFixed(0)}, '
                        '${look.dy.toStringAsFixed(0)}\n'
                        'inside=$inside',
                      );
                    },
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }

  List<Rect> _bodies(Size size) {
    const gap = 28.0;
    final total = _buddies.fold<double>(0.0, (sum, buddy) {
          final width = compact ? buddy.compactWidth : buddy.width;
          return sum + width;
        }) +
        gap * (_buddies.length - 1);
    var x = (size.width - total) / 2;
    final rects = <Rect>[];
    for (final buddy in _buddies) {
      final width = compact ? buddy.compactWidth : buddy.width;
      final height = compact ? buddy.compactHeight : buddy.height;
      final top = compact
          ? size.height - height
          : size.height * 0.72 - height;
      rects.add(Rect.fromLTWH(x, top, width, height));
      x += width + gap;
    }
    return rects;
  }
}
```

热重启后看数字。瞳孔这一步还在正中，这是对的。

---

## 第 6 步：用 Ticker 把追随变平滑

做完能看到：宽窗口里移动鼠标，三个人的瞳孔跟着走，中间琥珀色最快，左边绿色最慢。鼠标移出窗口，他们一起看向右侧（表单那一侧）。窄屏瞳孔先不动。

替换 `character_stage.dart`。其他文件不动。这一步改了 `initState`，**热重启**。

第 5 步角落里的坐标文字不要了。下面这份文件里没有它。

### 为什么听 ValueNotifier 不够

`ValueListenableBuilder` 只在 `look` **变成一个新值**时重建。鼠标停下之后不再有事件，值也不再变，就不会有下一帧。

瞳孔要的是：鼠标已经停了，角色还在往那个点走，直到足够近。这需要鼠标事件之外的帧。`Ticker` 向调度器注册，屏幕每刷新一次调用一次，鼠标动不动都会进回调。

这一步**不要** `bus.look.addListener`。Ticker 每帧自己读 `look.value`。读 `.value` 不会建立监听，所以表单也不会因为鼠标而重建。只有 `_onTick` 里发现瞳孔确实挪动了，才 `setState`。重建的是 `CharacterStage`，不是 `LoginScreen`。

### Ticker 和两种 mixin

`Ticker` 是「每一帧叫我」。`AnimationController` 内部就是一个 `Ticker`，再把经过的时间映射成 0 到 1。追随的目标每帧都在变，没有固定的终点，所以这里直接用 `Ticker`，不用控制器。闭眼那种「从 0 播到 1」才用控制器，那是第 9 步。

`createTicker` 来自 `TickerProvider`。`State` 通过 mixin 变成 provider：

- `SingleTickerProviderStateMixin`：整个 `State` 只能 `createTicker` 一次
- `TickerProviderStateMixin`：可以多次

现在手写的追随是一个 Ticker。第 9 步的闭眼控制器、第 11 步的进场控制器，各自还会再申请一个。一共三个。这一步如果用了 Single，第 9 步一创建控制器，运行时就会抛 `SingleTickerProviderStateMixin can only be used once`。所以现在就混入 `TickerProviderStateMixin`。

回调参数是 `Duration`：这个 Ticker 从 `start()` 起累计的时间。下面的算法**不用它**。每帧走的是「剩余距离的一个比例」，不是「这一毫秒该走多少像素」。

后果是：刷新率越高，每秒走的步数越多，追得越快。60Hz 和 120Hz 上手感不完全一样。教学实现就按帧走。要做成和刷新率无关，得用这段 `Duration` 算出上一帧的时间差，再把 `lag` 乘上 `dt / (1/60秒)`。这里不展开。

`createTicker` 只创建，不启动。`start()` 之后才开始要帧。

### 每一帧做什么

```text
没有挂载，或是手机布局        → 返回
舞台的 RenderBox 还没有尺寸  → 返回
_smooth 还是空的             → 三个人直接设成目标，setState，返回
否则每个人 lerp 一小步
有人移动超过 0.2 像素        → 写回 _smooth，setState
没人动                      → 不 setState
```

`_smooth` 是三个人**当前**的看点，坐标系是舞台：原点在舞台左上角，单位是像素。一开始是空列表，表示还没采样。

第一帧如果从 `Offset.zero` 去 lerp，瞳孔会从舞台左上角扫过来。所以第一次直接放到目标上。

`Offset.lerp(a, b, t)` 是 `a + (b - a) * t`。`t` 用这个角色的 `lag`：

| 角色 | lag | 这一帧走完剩余距离的 |
|---|---|---|
| 左，绿 | 0.08 | 8% |
| 中，琥珀 | 0.18 | 18% |
| 右，蓝 | 0.12 | 12% |

`lag` 越小越慢。三个人追**同一个**目标，速度不同，所以是先后转头。琥珀最快。

这是指数靠近，不会冲过目标。还差 100 像素、`lag = 0.18` 时，第一帧走 18，第二帧走剩下的 18%，越近越慢。剩余比例是 `(1 - lag)` 的 n 次方：

| 帧数（约 60Hz） | 琥珀还剩 | 绿色还剩 |
|---|---|---|
| 10 帧，约 0.17 秒 | 14% | 43% |
| 20 帧，约 0.33 秒 | 2% | 19% |
| 40 帧，约 0.67 秒 | 几乎到了 | 4% |

`lerp` 的返回类型是 `Offset?`，因为入参允许 null。这里两个点都不是 null，用 `!`。

位移小于 `0.2` 像素就当已经到位，不再写入。浮点会永远差一丁点，如果不设门槛，`setState` 停不下来。三个人都停了，Ticker 仍在跑（每帧读一下坐标），但不再重建。鼠标再动，下一帧又能接着追。

手机不 `start`。`compact` 在 `widget` 上，`initState` 里其实读得到。开关仍放在 `didChangeDependencies`，是为了和第 11 步放在一起：那一步要读 `MediaQuery`，而 `initState` 里读继承组件会直接抛错。窗口跨过 900 时，桌面和手机是两棵不同的子树，`CharacterStage` 会拆掉重建，不一定走 `didUpdateWidget`。`didUpdateWidget` 仍写上：同一个 State 上 `compact` 从 false 变成 true 时，也能停掉时钟。停的时候清空 `_smooth`，下次再启动会走「第一帧直接对齐」，不会从旧坐标漂过来。

### 目标点

`look` 是全局坐标。`context.findRenderObject()` 拿到舞台自己的 `RenderBox`（这个 `State` 对应的渲染对象就是舞台）。`globalToLocal` 把点换成舞台左上角为原点。

渲染对象在第一帧 layout 之前可能还没有尺寸，`hasSize` 为 false 就跳过。`globalToLocal` 在那之前没有意义。

规则：

- 手机：目标固定在舞台中部偏上 `(宽 / 2, 高 × 0.48)`。时钟不跑，`_smooth` 是空的，`build` 用这个点，瞳孔基本朝前。第 10 步再改成朝下。
- 指针不在页面里，或还没有 RenderBox：目标是 `(宽 + 80, 高 × 0.48)`。比右边缘再往外 80 像素，垂直在 48% 的高度。往外偏是为了让距离超过下面的 280 像素影响半径，瞳孔会完全偏向右侧，而不是停在「刚好看到舞台边缘」。
- 指针在页面里：`globalToLocal(look)`。鼠标在右侧表单上时，舞台局部坐标的 x 会**大于舞台宽度**。这是对的，角色就该看向舞台右边外面的那只手。

`LayoutBuilder` 给出的 `size` 和 `RenderBox.size` 是同一块矩形。换算全局坐标只能找 RenderBox；算「右边缘外面 80 像素」用 `size` 就行，这样第一帧 RenderBox 还没准备好时也能画出休息姿势。

### 看点怎么变成瞳孔

`_smooth` 里的点是舞台像素。眼睛要的是 `Alignment` 的 -1 到 1。

眼睛中心先换到同一坐标系：

```text
eye = 角色矩形的 topLeft + eyeCenterInBody(width)
```

`topLeft` 是舞台坐标，`eyeCenterInBody` 是角色内部坐标，加在一起就是舞台上的眼睛中点。绘制眼睛用的也是 `eyeLeftOf` / `eyeRightOf` / `eyeTopOf`，所以这个点和屏幕上的眼睛是同一个。

然后：

```text
delta = look - eye
dist  = delta 的长度
dist < 1        → 瞳孔 (0, 0)，避免除以接近 0 的数，也避免在眼睛正中抖动
否则方向        = (delta.dx / dist, delta.dy / dist)    // 长度变成 1
t               = min(1, dist / 280)
pupil           = 方向 × t
```

先变成单位向量再乘 `t`，瞳孔落在圆上，不是方上。如果不归一、只把 x 和 y 分别夹到 -1~1，斜向看的时候会顶到角上 `(1, 1)`，比朝正右时离中心更远。

`280` 是影响半径，单位是舞台像素。

- 鼠标离眼睛 140 像素：`t = 0.5`，瞳孔走到中心到边缘的一半
- 280 像素或更远：`t = 1`，瞳孔贴着眼白边缘

角色宽大约 80 到 110。光标在右侧表单上时，距离通常超过 280，瞳孔会完全看向表单。光标在脸附近时只偏一点点。

两只眼睛仍然共用这一个 `pupil`，第 3 步已经这样画了。舞台只算一次，传给 `CookCharacter`。

举例：眼睛在舞台 `(200, 400)`，鼠标转换后在 `(480, 400)`。`delta = (280, 0)`，`t = 1`，`pupil = (1, 0)`，两只眼都贴右边。鼠标在 `(340, 400)` 时 `t = 0.5`，`pupil = (0.5, 0)`。

### 源码：`character_stage.dart`

```dart
import 'package:cook_app/ui/auth/login/widgets/cook_character.dart';
import 'package:cook_app/ui/auth/login/widgets/gaze_bus.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

class _Buddy {
  const _Buddy({
    required this.color,
    required this.width,
    required this.height,
    required this.compactWidth,
    required this.compactHeight,
    required this.lag,
  });

  final Color color;
  final double width;
  final double height;
  final double compactWidth;
  final double compactHeight;
  final double lag;
}

const _buddies = [
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
    required this.bus,
    required this.compact,
    super.key,
  });

  final GazeBus bus;
  final bool compact;

  @override
  State<CharacterStage> createState() => _CharacterStageState();
}

class _CharacterStageState extends State<CharacterStage>
    with TickerProviderStateMixin {
  late final Ticker _track;
  final _smooth = <Offset>[];

  @override
  void initState() {
    super.initState();
    _track = createTicker(_onTick);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _syncTicker();
  }

  @override
  void didUpdateWidget(CharacterStage oldWidget) {
    super.didUpdateWidget(oldWidget);
    _syncTicker();
  }

  void _syncTicker() {
    final run = !widget.compact;
    if (run && !_track.isActive) {
      _track.start();
    }
    if (!run && _track.isActive) {
      _track.stop();
      _smooth.clear();
    }
  }

  void _onTick(Duration _) {
    if (!mounted || widget.compact) {
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

  Offset _target(Size size, RenderBox? box) {
    if (widget.compact) {
      return Offset(size.width / 2, size.height * 0.48);
    }
    if (!widget.bus.pointerInside.value || box == null || !box.hasSize) {
      return Offset(size.width + 80, size.height * 0.48);
    }
    return box.globalToLocal(widget.bus.look.value);
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

  Widget _placed(int index, Rect body, Offset fallback) {
    final look = _smooth.length == _buddies.length ? _smooth[index] : fallback;
    final eye = body.topLeft + CookCharacterMetrics.eyeCenterInBody(body.width);
    return Positioned(
      left: body.left,
      top: body.top,
      width: body.width,
      height: body.height,
      child: CookCharacter(
        color: _buddies[index].color,
        width: body.width,
        height: body.height,
        pupil: _pupil(look, eye),
        eyeOpen: 1,
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
    const gap = 28.0;
    final total = _buddies.fold<double>(0.0, (sum, buddy) {
          final width = widget.compact ? buddy.compactWidth : buddy.width;
          return sum + width;
        }) +
        gap * (_buddies.length - 1);
    var x = (size.width - total) / 2;
    final rects = <Rect>[];
    for (final buddy in _buddies) {
      final width = widget.compact ? buddy.compactWidth : buddy.width;
      final height = widget.compact ? buddy.compactHeight : buddy.height;
      final top = widget.compact
          ? size.height - height
          : size.height * 0.72 - height;
      rects.add(Rect.fromLTWH(x, top, width, height));
      x += width + gap;
    }
    return rects;
  }

  @override
  void dispose() {
    _track.dispose();
    super.dispose();
  }
}
```

`_smooth` 还是空的时候（第一帧，或手机），`build` 用 `_target` 当看点，避免瞳孔先停在 `(0, 0)` 再跳。时钟的第一帧会把 `_smooth` 填上并再重建一次。

热重启。宽窗口里跟着鼠标看，移出窗口后看向右边。窄屏先确认角色还在，瞳孔不要追鼠标。

---

## 第 7 步：身体只歪一点点

做完能看到：瞳孔仍用满 -1 到 1。身体只轻轻侧向鼠标，脚底不动。窄屏身体不歪。

替换 `cook_character.dart` 和 `character_stage.dart`。没有新的 `initState`，热重载即可。如果热重载后身体不动，再热重启一次。

### Transform.rotate 的角度和支点

`Transform.rotate` 绕一个点转孩子。`angle` 的单位是**弧度**，不是度。`0.1` 弧度大约是 `0.1 × 180 / π ≈ 5.7` 度。再大就会像在滑，而不是在看。

Flutter 的 y 轴朝下。数学课里 y 轴朝上，正角度是逆时针；屏幕坐标里正角度是**顺时针**。鼠标在角色右边时 `dx > 0`，正角度让头顶往右倒。

`alignment: Alignment.bottomCenter` 是支点：孩子底部的中点留在原地，头在动。用 `Alignment.center` 的话，整个人会绕肚子转，脚会离开地面。

变换发生在绘制阶段，`Positioned` 的矩形不变。头歪出矩形时，靠第 4 步舞台上的 `Clip.none` 才不会被裁掉。

### 和瞳孔共用看点，但幅度小得多

用同一个人的平滑看点，不要再读一次鼠标。否则眼睛已经慢慢转过去了，身体还贴着原始坐标，两套速度会拧着。

```text
dx   = 看点.x - 身体中心.x
lean = clamp(dx / 520, -1, 1) × 0.1
```

`dx / 520` 先变成大约 -1 到 1：看点在身体中心右边 520 像素时顶满。再乘 `0.1`，最大只有 0.1 弧度。

瞳孔的影响半径是 280。看向表单时，眼睛先贴到眼白边缘，身体往往还没到 0.1 弧度。这是故意的：眼睛负责「看」，身体只表示「朝那边」。

`body.center` 是矩形的中心，不是眼睛。绕的是脚底，量的是身体中线，侧过去才稳。

窄屏 `lean` 固定为 0。手机上的角色第 10 步会只露出头，再歪就会钻进卡片里。

### 源码：`cook_character.dart`

在第 3 步的基础上加了 `lean`，以及外面的 `Transform.rotate`。眼睛的画法没变。

```dart
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

abstract final class CookCharacterMetrics {
  static double eyeSizeOf(double width) => width * 0.22;

  static double eyeTopOf(double width) => width * 0.16;

  static double eyeLeftOf(double width) => width * 0.22;

  static double eyeRightOf(double width) => width * 0.56;

  /// Eye center, measured from the top-left of the character.
  static Offset eyeCenterInBody(double width) {
    final eye = eyeSizeOf(width);
    final midX =
        (eyeLeftOf(width) + eye / 2 + eyeRightOf(width) + eye / 2) / 2;
    return Offset(midX, eyeTopOf(width) + eye / 2);
  }
}

class CookCharacter extends StatelessWidget {
  const CookCharacter({
    required this.color,
    required this.width,
    required this.height,
    required this.pupil,
    required this.eyeOpen,
    required this.lean,
    super.key,
  });

  final Color color;
  final double width;
  final double height;
  final Offset pupil;
  final double eyeOpen;
  final double lean;

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      alignment: Alignment.bottomCenter,
      angle: lean,
      child: SizedBox(
        width: width,
        height: height,
        child: Stack(
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
    final size = CookCharacterMetrics.eyeSizeOf(width);
    return Positioned(
      left: left,
      top: CookCharacterMetrics.eyeTopOf(width),
      width: size,
      height: size,
      child: _Eye(pupil: pupil, eyeOpen: eyeOpen, lidColor: color),
    );
  }
}

class _Eye extends StatelessWidget {
  const _Eye({
    required this.pupil,
    required this.eyeOpen,
    required this.lidColor,
  });

  final Offset pupil;
  final double eyeOpen;
  final Color lidColor;

  @override
  Widget build(BuildContext context) {
    return ClipOval(
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
              heightFactor: (1 - eyeOpen).clamp(0.0, 1.0),
              child: ColoredBox(color: lidColor),
            ),
          ),
        ],
      ),
    );
  }
}
```

### 源码：`character_stage.dart`

和第 6 步是同一份，只多了 `lean` 的计算，并把它传给角色。`_Buddy`、时钟、瞳孔都不变。

```dart
import 'package:cook_app/ui/auth/login/widgets/cook_character.dart';
import 'package:cook_app/ui/auth/login/widgets/gaze_bus.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

class _Buddy {
  const _Buddy({
    required this.color,
    required this.width,
    required this.height,
    required this.compactWidth,
    required this.compactHeight,
    required this.lag,
  });

  final Color color;
  final double width;
  final double height;
  final double compactWidth;
  final double compactHeight;
  final double lag;
}

const _buddies = [
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
    required this.bus,
    required this.compact,
    super.key,
  });

  final GazeBus bus;
  final bool compact;

  @override
  State<CharacterStage> createState() => _CharacterStageState();
}

class _CharacterStageState extends State<CharacterStage>
    with TickerProviderStateMixin {
  late final Ticker _track;
  final _smooth = <Offset>[];

  @override
  void initState() {
    super.initState();
    _track = createTicker(_onTick);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _syncTicker();
  }

  @override
  void didUpdateWidget(CharacterStage oldWidget) {
    super.didUpdateWidget(oldWidget);
    _syncTicker();
  }

  void _syncTicker() {
    final run = !widget.compact;
    if (run && !_track.isActive) {
      _track.start();
    }
    if (!run && _track.isActive) {
      _track.stop();
      _smooth.clear();
    }
  }

  void _onTick(Duration _) {
    if (!mounted || widget.compact) {
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

  Offset _target(Size size, RenderBox? box) {
    if (widget.compact) {
      return Offset(size.width / 2, size.height * 0.48);
    }
    if (!widget.bus.pointerInside.value || box == null || !box.hasSize) {
      return Offset(size.width + 80, size.height * 0.48);
    }
    return box.globalToLocal(widget.bus.look.value);
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

  Widget _placed(int index, Rect body, Offset fallback) {
    final look = _smooth.length == _buddies.length ? _smooth[index] : fallback;
    final eye = body.topLeft + CookCharacterMetrics.eyeCenterInBody(body.width);
    final dx = look.dx - body.center.dx;
    final lean = widget.compact ? 0.0 : (dx / 520).clamp(-1.0, 1.0) * 0.1;
    return Positioned(
      left: body.left,
      top: body.top,
      width: body.width,
      height: body.height,
      child: CookCharacter(
        color: _buddies[index].color,
        width: body.width,
        height: body.height,
        pupil: _pupil(look, eye),
        eyeOpen: 1,
        lean: lean,
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
    const gap = 28.0;
    final total = _buddies.fold<double>(0.0, (sum, buddy) {
          final width = widget.compact ? buddy.compactWidth : buddy.width;
          return sum + width;
        }) +
        gap * (_buddies.length - 1);
    var x = (size.width - total) / 2;
    final rects = <Rect>[];
    for (final buddy in _buddies) {
      final width = widget.compact ? buddy.compactWidth : buddy.width;
      final height = widget.compact ? buddy.compactHeight : buddy.height;
      final top = widget.compact
          ? size.height - height
          : size.height * 0.72 - height;
      rects.add(Rect.fromLTWH(x, top, width, height));
      x += width + gap;
    }
    return rects;
  }

  @override
  void dispose() {
    _track.dispose();
    super.dispose();
  }
}
```

---

## 第 8 步：表单把焦点写成模式

做完能看到：右侧是登录表单。舞台左上角临时显示 `idle` / `email` / `password` / `passwordVisible`。点进邮箱是 `email`，角色仍跟着鼠标（人在右边打字时，鼠标本来就在表单上，所以会看向表单）。点进密码框应变成 `password`，点眼睛图标应变成 `passwordVisible`。这一步密码还不会让他们闭眼，闭眼是第 9 步。

新建 `login_form.dart`。替换 `login_screen.dart` 和 `character_stage.dart`。`gaze_bus.dart` 从第 5 步起不要再改。

改了表单的 `initState`，**热重启**。

### 四种模式

```text
idle              两个框都没有焦点
email             邮箱有焦点
password          密码有焦点，并且密码被遮住
passwordVisible   密码有焦点，并且密码正显示出来
```

邮箱和密码不会同时有焦点。所以先看密码框：它有焦点，就只在 `password` 和 `passwordVisible` 里选。它没有焦点，再看邮箱。

### FocusNode 只在焦点变化时通知

`FocusNode.addListener` 在「得到焦点」和「失去焦点」时调用，打字不会叫它。

遮挡开关是个 `IconButton`。点它只翻转 `_obscure`，焦点还在密码框上，`FocusNode` 不会响。如果只 `setState`，界面上的圆点会变成明文，`GazeBus.mode` 仍是 `password`，第 9 步的角色就不知道该把眼睛睁开一条缝。所以切换之后要再调一次 `_sync`。

`_sync` 只写 `mode.value`。值没变时 `ValueNotifier` 不会通知，重复写同一个枚举没有额外重建。

### 谁先 dispose

表单是页面的子组件。子组件的 `dispose` 早于页面。这时 `GazeBus` 还在，`_sync` 用过的 `widget.bus` 仍然可以碰——但 `dispose` 里不要再写 mode，只摘监听、再释放焦点和控制器。

顺序是：先 `removeListener`，再 `dispose` 这个 `FocusNode`。反过来的话，节点销毁过程中还可能回调一个已经不想听的函数。

登录按钮的 `onPressed` 先空着。动画跑通之后，再在里面调已有的 `AuthRepository`。

### 舞台上的模式文字

用 `ValueListenableBuilder` 只包住那一行字，不要 `bus.mode.addListener` 去 `setState` 整个舞台。角色这一步还不看模式。第 9 步才会监听，因为那时要启动闭眼控制器。第 9 步的文件里没有这行字。

### 源码：`login_form.dart`

表单用 `Material`，颜色是不透明的白，圆角 16，边框 `AppColors.green1`。第 10 步手机上要靠这块不透明白色盖住角色的下半截。现在先把它放在桌面右侧，顺便把组件定下来。

```dart
import 'package:cook_app/ui/auth/login/widgets/gaze_bus.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

class LoginForm extends StatefulWidget {
  const LoginForm({required this.bus, super.key});

  final GazeBus bus;

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();
  final _email = TextEditingController();
  final _password = TextEditingController();
  var _obscure = true;

  @override
  void initState() {
    super.initState();
    _emailFocus.addListener(_sync);
    _passwordFocus.addListener(_sync);
  }

  void _sync() {
    final next = _passwordFocus.hasFocus
        ? (_obscure ? GazeMode.password : GazeMode.passwordVisible)
        : (_emailFocus.hasFocus ? GazeMode.email : GazeMode.idle);
    widget.bus.mode.value = next;
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.white1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.green1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('登录', style: Theme.of(context).textTheme.headlineLarge),
            const SizedBox(height: 24),
            TextField(
              controller: _email,
              focusNode: _emailFocus,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: '邮箱',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _password,
              focusNode: _passwordFocus,
              obscureText: _obscure,
              decoration: InputDecoration(
                labelText: '密码',
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  onPressed: () {
                    setState(() => _obscure = !_obscure);
                    _sync();
                  },
                  icon: Icon(
                    f3
                        ? Icons.visibility_outlined
                        : Icons.visibility_off_outlined,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            FilledButton(onPressed: () {}, child: const Text('登录')),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _emailFocus.removeListener(_sync);
    _passwordFocus.removeListener(_sync);
    _emailFocus.dispose();
    _passwordFocus.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }
}
```

### 源码：`login_screen.dart`

桌面右侧宽 460，表单宽 360，垂直居中，两边留白。窄屏仍是上面一块舞台、下面表单，方便你在窄窗口里也能点密码框。趴在卡片上是第 10 步。

```dart
import 'package:cook_app/ui/auth/login/widgets/character_stage.dart';
import 'package:cook_app/ui/auth/login/widgets/gaze_bus.dart';
import 'package:cook_app/ui/auth/login/widgets/login_form.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _bus = GazeBus();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white1,
      body: LayoutBuilder(
        builder: (context, constraints) {
          final desktop = constraints.maxWidth >= 900;
          return MouseRegion(
            onEnter: (_) => _bus.pointerInside.value = true,
            onExit: (_) => _bus.pointerInside.value = false,
            onHover: (event) {
              _bus.pointerInside.value = true;
              _bus.look.value = event.position;
            },
            child: desktop ? _desktop() : _mobile(),
          );
        },
      ),
    );
  }

  Widget _desktop() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: ColoredBox(
            color: AppColors.green1,
            child: CharacterStage(bus: _bus, compact: false),
          ),
        ),
        SizedBox(
          width: 460,
          child: Center(
            child: SizedBox(width: 360, child: LoginForm(bus: _bus)),
          ),
        ),
      ],
    );
  }

  Widget _mobile() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 220,
          child: ColoredBox(
            color: AppColors.green1,
            child: CharacterStage(bus: _bus, compact: true),
          ),
        ),
        Expanded(
          child: Center(
            child: SingleChildScrollView(p
              padding: const EdgeInsets.all(24),
              child: SizedBox(width: 360, child: LoginForm(bus: _bus)),
            ),
          ),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _bus.dispose();
    super.dispose();
  }
}
```

### 源码：`character_stage.dart`

只比第 7 步多了左上角的模式文字。时钟和身体侧倾保持原样。

```dart
import 'package:cook_app/ui/auth/login/widgets/cook_character.dart';
import 'package:cook_app/ui/auth/login/widgets/gaze_bus.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

class _Buddy {
  const _Buddy({
    required this.color,
    required this.width,
    required this.height,
    required this.compactWidth,
    required this.compactHeight,
    required this.lag,
  });

  final Color color;
  final double width;
  final double height;
  final double compactWidth;
  final double compactHeight;
  final double lag;
}

const _buddies = [
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
    required this.bus,
    required this.compact,
    super.key,
  });

  final GazeBus bus;
  final bool compact;

  @override
  State<CharacterStage> createState() => _CharacterStageState();
}

class _CharacterStageState extends State<CharacterStage>
    with TickerProviderStateMixin {
  late final Ticker _track;
  final _smooth = <Offset>[];

  @override
  void initState() {
    super.initState();
    _track = createTicker(_onTick);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _syncTicker();
  }

  @override
  void didUpdateWidget(CharacterStage oldWidget) {
    super.didUpdateWidget(oldWidget);
    _syncTicker();
  }

  void _syncTicker() {
    final run = !widget.compact;
    if (run && !_track.isActive) {
      _track.start();
    }
    if (!run && _track.isActive) {
      _track.stop();
      _smooth.clear();
    }
  }

  void _onTick(Duration _) {
    if (!mounted || widget.compact) {
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

  Offset _target(Size size, RenderBox? box) {
    if (widget.compact) {
      return Offset(size.width / 2, size.height * 0.48);
    }
    if (!widget.bus.pointerInside.value || box == null || !box.hasSize) {
      return Offset(size.width + 80, size.height * 0.48);
    }
    return box.globalToLocal(widget.bus.look.value);
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
            Positioned(
              left: 12,
              top: 12,
              child: ValueListenableBuilder<GazeMode>(
                valueListenable: widget.bus.mode,
                builder: (context, mode, _) => Text(mode.name),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _placed(int index, Rect body, Offset fallback) {
    final look = _smooth.length == _buddies.length ? _smooth[index] : fallback;
    final eye = body.topLeft + CookCharacterMetrics.eyeCenterInBody(body.width);
    final dx = look.dx - body.center.dx;
    final lean = widget.compact ? 0.0 : (dx / 520).clamp(-1.0, 1.0) * 0.1;
    return Positioned(
      left: body.left,
      top: body.top,
      width: body.width,
      height: body.height,
      child: CookCharacter(
        color: _buddies[index].color,
        width: body.width,
        height: body.height,
        pupil: _pupil(look, eye),
        eyeOpen: 1,
        lean: lean,
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
    const gap = 28.0;
    final total = _buddies.fold<double>(0.0, (sum, buddy) {
          final width = widget.compact ? buddy.compactWidth : buddy.width;
          return sum + width;
        }) +
        gap * (_buddies.length - 1);
    var x = (size.width - total) / 2;
    final rects = <Rect>[];
    for (final buddy in _buddies) {
      final width = widget.compact ? buddy.compactWidth : buddy.width;
      final height = widget.compact ? buddy.compactHeight : buddy.height;
      final top = widget.compact
          ? size.height - height
          : size.height * 0.72 - height;
      rects.add(Rect.fromLTWH(x, top, width, height));
      x += width + gap;
    }
    return rects;
  }

  @override
  void dispose() {
    _track.dispose();
    super.dispose();
  }
}
```

热重启。点每个输入框和眼睛图标，看左上角的单词。角色仍跟着鼠标，包括焦点在密码框里的时候。

---

## 第 9 步：闭眼和捂眼

做完能看到：点进密码框，三个人按从左到右的顺序闭上眼。绿色举起两只手捂住，蓝色一只手挡上，琥珀色只闭眼。点显示密码，手退到半路，眼睛留一条缝，缝是朝下的。点回邮箱，先按相反的顺序睁开，再重新跟着鼠标。

替换 `cook_character.dart` 和 `character_stage.dart`。第 8 步左上角的 `mode.name` 不要了，闭眼本身就能看出模式。`login_form.dart` 和 `login_screen.dart` 不动。

加了控制器，创建发生在 `initState`，**热重启**。

### 一个控制器，三个时间窗口

`AnimationController` 内部是一个 `Ticker`。它把时间映射成一个数，默认从 0 到 1。`vsync: this` 用的就是第 6 步那个 mixin：页面不在树上、或者系统要求停掉动画时，这个时钟会跟着停。

这一步再创建一个控制器，加上第 6 步手写的 `Ticker`，一共两个。mixin 必须是 `TickerProviderStateMixin`。

```text
duration        460ms   正向：从当前值走到 1（闭眼、抬手）
reverseDuration 240ms   反向：从当前值走回 0（睁眼、放手）
```

`forward()` 朝 1 播，`reverse()` 朝 0 播。已经在 1 时再 `forward()`，会停在 1，不会重头再放一遍。从「密码被遮住」切到「密码可见」就是这种：控制器已在终点，只改下面的目标系数，缝和手的位置直接切过去。

不要给三个人各做一个控制器。三个时钟会各自漂移，也多占两个 Ticker。用**同一条** 0 到 1 的时间线，每个人只取其中一段。

控制器自己在跑，Widget 不会自动重画。`_pose.addListener(_rebuild)`，每一拍 `setState`。漏了监听，值在变，画面停在第一帧。

`dispose` 里先 `removeListener`，再 `dispose` 控制器。`mounted` 在 `super.dispose()` 之前仍是 true。控制器若在销毁时通知监听，`setState` 会报错。

### interval：把全局进度切成一段局部进度

```text
t <= begin              → 0     这段还没开始
t >= end                → 1     这段已经结束，固定在终点
否则 local = (t - begin) / (end - begin)
     返回 curve.transform(local)
```

`local` 是这段窗口内部的 0 到 1。曲线作用在 `local` 上，不是作用在整条 460ms 上。窗口走完之后直接返回 1，不返回 `curve(1)` 以外的值。`easeOutBack` 的冲过终点发生在窗口**内部**（`local` 还没到 1 的时候值已经大于 1，到 1 时又回到 1）。所以冲一下、再落回终点，都能看见。

`i` 是 0、1、2，也就是左、中、右。不是按身高排的。矮的那个在中间，它不是第一个。

控制器 460ms 时，闭眼窗口（`easeIn`）：

| i | 谁 | 开始 | 结束 |
|---|---|---|---|
| 0 | 左，绿，双手 | 0.04 → 18ms | 0.42 → 193ms |
| 1 | 中，琥珀，没有手 | 0.16 → 74ms | 0.52 → 239ms |
| 2 | 右，蓝，一只手 | 0.28 → 129ms | 0.62 → 285ms |

抬手窗口（`easeOutBack`）：

| i | 谁 | 开始 | 结束 |
|---|---|---|---|
| 0 | 绿，双手 | 0.18 → 83ms | 0.78 → 359ms |
| 1 | 琥珀 | 算了也不画 | |
| 2 | 蓝，单手 | 0.38 → 175ms | 0.90 → 414ms |

先看到眼皮，再看到手。左边先动，右边最后。反向时长是 240ms，数值从 1 走回 0，所以睁开的时候是右边先动、左边最后，整段更快。

`Curves.easeIn`：开头慢、后面快，眼皮像落下去。它的输出留在 0 到 1。

`Curves.easeOutBack`：快到终点时会略超过 1，再回到 1。手会比「正好盖住眼睛」再冲出去一点，然后落回来。

### 闭多少、手到哪

```text
shut = password          → 1
       passwordVisible   → 0.62
       其他              → 1（这段期间用不到，见下面的 _visualMode）

poseOpen = 1 - close × shut
```

`close` 是这个人的眼皮进度，0 还没闭，1 闭完。

- 普通密码：`poseOpen` 从 1 到 0，全闭上
- 密码可见：`poseOpen` 从 1 到 `1 - 0.62 = 0.38`，留下一条缝

手的进度再乘一个目标：

- 普通密码 × 1，手走到眼睛上
- 密码可见 × 0.45，`lerp` 只走 45%，停在半路

琥珀色的 `hands` 是 `HandStyle.none`，舞台把 `handCover` 传下去也没有手可画。

### 为什么要留一个 _visualMode

表单一失焦，`GazeBus.mode` 已经是 `idle`。如果这一帧就按 `idle` 来画：

- 手的代码是「害羞才用 `handsT`，否则 0」。手会当场消失，反向动画没了
- 若眼睛写成「不害羞就完全睁开」，眼皮也会当场打开
- 即便眼睛仍乘着 `close`，从「密码可见、shut = 0.62」跳到默认 `shut = 1`，缝会先猛地闭死再睁开

所以舞台自己留 `_visualMode`。进入害羞：立刻改成新模式，再 `forward()`。离开害羞：`_visualMode` 先不动，`reverse()` 播完再改回 `idle`。播的过程中眼皮和手仍按密码那一套系数往回走。

快速连点时，旧的 `whenComplete` 还会跑：

1. 焦点进密码。`generation = 1`，`_visualMode = password`，`forward()`
2. 马上点回邮箱。`generation = 2`，开始 `reverse()`，完成回调打算改回 `idle`
3. 反向还没播完又点进密码。`generation = 3`，`_visualMode = password`，`forward()`
4. 第 2 步的回调到了。`generation` 对不上 3，丢掉，不能把正在害羞的画面改回 `idle`

`mounted` 也要看。页面已经拆掉时不能 `setState`。

### 害羞时看向下方，身体略微别开

三个人仍追**一个**目标。害羞期间目标改成舞台底边中点再往下 40 像素：`(宽 / 2, 高 + 40)`。每只眼睛用自己的中心去减这个点，算出来的方向是朝下。不要给每个人各算一个「自己的脚」，那样又回到第 6 步想避免的各看各的。

眼睛全闭时看不出瞳孔。密码可见、留着缝时，缝是朝下的，不是盯着密码框。

身体在原来的侧倾和第 9 步的「别开」之间混合：

```text
lean = 追随侧倾 × (1 - pose) + (-0.05) × pose
```

`pose = 0` 时就是第 7 步的侧倾。`pose = 1` 时是 -0.05 弧度，大约 3 度，头往左偏，也就是别开右侧的表单。负角度是逆时针（屏幕 y 轴朝下，负角度让头顶往左）。窄屏侧倾仍是 0。

窄屏这一步如果点了密码，手仍会画。第 10 步再改成手机只闭眼。

### 手怎么画

手画在眼睛上面，所以放在 `Stack` 的更后面。`handCover <= 0` 时不创建手，避免一排完全透明的圆。

角色的 `Stack` 从这一步起 `clipBehavior: Clip.none`。左手的休息位置在 `x` 为负的地方，默认裁剪会把伸到身体外面的手切掉。

位置是 `Offset.lerp(休息点, 盖住眼睛的点, handCover)`。`handCover` 允许略大于 1，这样 `easeOutBack` 的冲出才会出现在位置上。如果先 `clamp` 再 `lerp`，手会精确停在眼睛上，冲过终点的那一下就没了。

`Opacity` 只接受 0 到 1，超出会在调试模式断言失败。所以只在传给 `Opacity` 时 `clamp`，插值用原始值。

休息点和盖眼点都从角色左上角量。盖眼点用 `CookCharacterMetrics` 的眼睛位置，不要再写一套 `0.16 / 0.22 / 0.56`。

- 双手：直径 `0.30 × w`，大约盖住一只眼。休息在 `0.62h` 的两侧，左手略伸出身体左边。`h` 变了，手的休息高度跟着变；眼睛的位置仍然只看 `w`
- 单手：直径 `0.46 × 宽`，大约两只眼那么宽，盖在两眼正中。休息在身体右下

颜色是 `Color.lerp(身体色, 黑色, 0.12)`，比身体深一点，白边才能从脸上分出来。白边透明度 0.45。

### 源码：`cook_character.dart`

```dart
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

enum HandStyle { none, both, single }

abstract final class CookCharacterMetrics {
  static double eyeSizeOf(double width) => width * 0.22;

  static double eyeTopOf(double width) => width * 0.16;

  static double eyeLeftOf(double width) => width * 0.22;

  static double eyeRightOf(double width) => width * 0.56;

  /// Eye center, measured from the top-left of the character.
  static Offset eyeCenterInBody(double width) {
    final eye = eyeSizeOf(width);
    final midX =
        (eyeLeftOf(width) + eye / 2 + eyeRightOf(width) + eye / 2) / 2;
    return Offset(midX, eyeTopOf(width) + eye / 2);
  }
}

class CookCharacter extends StatelessWidget {
  const CookCharacter({
    required this.color,
    required this.width,
    required this.height,
    required this.pupil,
    required this.eyeOpen,
    required this.handCover,
    required this.lean,
    required this.hands,
    super.key,
  });

  final Color color;
  final double width;
  final double height;
  final Offset pupil;
  final double eyeOpen;
  final double handCover;
  final double lean;
  final HandStyle hands;

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
            if (hands != HandStyle.none && handCover > 0) _hands(height),
          ],
        ),
      ),
    );
  }

  Widget _eye(double left) {
    final size = CookCharacterMetrics.eyeSizeOf(width);
    return Positioned(
      left: left,
      top: CookCharacterMetrics.eyeTopOf(width),
      width: size,
      height: size,
      child: _Eye(pupil: pupil, eyeOpen: eyeOpen, lidColor: color),
    );
  }

  Widget _hands(double height) {
    final single = hands == HandStyle.single;
    final hand = single ? width * 0.46 : width * 0.30;
    final eyeTop = CookCharacterMetrics.eyeTopOf(width);
    final widgets = <Widget>[];
    if (single) {
      final rest = Offset(width * 0.7, height * 0.62);
      final over = Offset((width - hand) / 2, eyeTop - hand * 0.15);
      widgets.add(_hand(Offset.lerp(rest, over, handCover)!, hand));
    } else {
      final leftRest = Offset(-hand * 0.15, height * 0.62);
      final rightRest = Offset(width - hand * 0.85, height * 0.62);
      final leftOver = Offset(
        CookCharacterMetrics.eyeLeftOf(width) - hand * 0.2,
        eyeTop - hand * 0.1,
      );
      final rightOver = Offset(
        CookCharacterMetrics.eyeRightOf(width) - hand * 0.15,
        eyeTop - hand * 0.1,
      );
      widgets
        ..add(_hand(Offset.lerp(leftRest, leftOver, handCover)!, hand))
        ..add(_hand(Offset.lerp(rightRest, rightOver, handCover)!, hand));
    }
    return Stack(clipBehavior: Clip.none, children: widgets);
  }

  Widget _hand(Offset origin, double size) {
    return Positioned(
      left: origin.dx,
      top: origin.dy,
      width: size,
      height: size,
      child: Opacity(
        opacity: handCover.clamp(0.0, 1.0),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: Color.lerp(color, AppColors.black1, 0.12),
            shape: BoxShape.circle,
            border: Border.all(
              color: AppColors.white1.withValues(alpha: 0.45),
              width: 2,
            ),
          ),
        ),
      ),
    );
  }
}

class _Eye extends StatelessWidget {
  const _Eye({
    required this.pupil,
    required this.eyeOpen,
    required this.lidColor,
  });

  final Offset pupil;
  final double eyeOpen;
  final Color lidColor;

  @override
  Widget build(BuildContext context) {
    return ClipOval(
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
              heightFactor: (1 - eyeOpen).clamp(0.0, 1.0),
              child: ColoredBox(color: lidColor),
            ),
          ),
        ],
      ),
    );
  }
}
```

### 源码：`character_stage.dart`

```dart
import 'package:cook_app/ui/auth/login/widgets/cook_character.dart';
import 'package:cook_app/ui/auth/login/widgets/gaze_bus.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

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
    color: AppColors.green3,
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
    required this.bus,
    required this.compact,
    super.key,
  });

  final GazeBus bus;
  final bool compact;

  @override
  State<CharacterStage> createState() => _CharacterStageState();
}

class _CharacterStageState extends State<CharacterStage>
    with TickerProviderStateMixin {
  late final Ticker _track;
  late final AnimationController _pose;

  final _smooth = <Offset>[];
  var _visualMode = GazeMode.idle;
  var _generation = 0;

  @override 
  void initState() {
    super.initState();
    _pose = AnimationController(
      vsync: this,_
      duration: const Duration(milliseconds: 460),
      reverseDuration: const Duration(milliseconds: 240),
    );
    _track = createTicker(_onTick);
    widget.bus.mode.addListener(_onMode);
    _pose.addListener(_rebuild);
  }

  void _rebuild() {
    if (mounted) {
      setState(() {});
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _syncTicker();
  }

  @override
  void didUpdateWidget(CharacterStage oldWidget) {
    super.didUpdateWidget(oldWidget);
    _syncTicker();
  }

  void _syncTicker() {
    final run = !widget.compact;
    if (run && !_track.isActive) {
      _track.start();
    }
    if (!run && _track.isActive) {
      _track.stop();
      _smooth.clear();
    }
  }

  void _onTick(Duration _) {
    if (!mounted || widget.compact) {
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

  Offset _target(Size size, RenderBox? box) {
    if (_isShy(_visualMode)) {
      return Offset(size.width / 2, size.height + 40);
    }
    if (widget.compact) {
      return Offset(size.width / 2, size.height * 0.48);
    }
    if (!widget.bus.pointerInside.value || box == null || !box.hasSize) {
      return Offset(size.width + 80, size.height * 0.48);
    }
    return box.globalToLocal(widget.bus.look.value);
  }

  void _onMode() {
    final next = widget.bus.mode.value;
    final generation = ++_generation;
    if (_isShy(next)) {
      setState(() => _visualMode = next);
      _pose.forward();
      return;
    }
    if (_isShy(_visualMode)) {
      _pose.reverse().whenComplete(() {
        if (!mounted || generation != _generation) {
          return;
        }
        setState(() => _visualMode = GazeMode.idle);
      });
    }
  }

  bool _isShy(GazeMode mode) =>
      mode == GazeMode.password || mode == GazeMode.passwordVisible;

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

  Widget _placed(int index, Rect body, Offset fallback) {
    final look = _smooth.length == _buddies.length ? _smooth[index] : fallback;
    final eye = body.topLeft + CookCharacterMetrics.eyeCenterInBody(body.width);
    final close = _interval(
      _pose.value,
      0.04 + index * 0.12,
      0.42 + index * 0.10,
      Curves.easeIn,
    );
    final handsT = _interval(
      _pose.value,
      0.18 + index * 0.10,
      0.78 + index * 0.06,
      Curves.easeOutBack,
    );
    final shut = switch (_visualMode) {
      GazeMode.password => 1.0,
      GazeMode.passwordVisible => 0.62,
      _ => 1.0,
    };
    final eyeOpen = 1 - close * shut;
    final handTarget = switch (_visualMode) {
      GazeMode.passwordVisible => 0.45,
      _ => 1.0,
    };
    final dx = look.dx - body.center.dx;
 _
    final lean = widget.compact
        ? 0.0
        : trackLean * (1 - _pose.value) + -0.05 * _pose.value;
    return Positioned(
      left: body.left,
      top: body.top,
      width: body.width,
      height: body.height,
      child: CookCharacter(
        color: _buddies[index].color,
        width: body.width,
        height: body.height,
        pupil: _pupil(look, eye),
        eyeOpen: eyeOpen.clamp(0.0, 1.0),
        handCover: _isShy(_visualMode) ? handsT * handTarget : 0,
        lean: lean,
        hands: _buddies[index].hands,
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
    const gap = 28.0;
    final total = _buddies.fold<double>(0.0, (sum, buddy) {
          final width = widget.compact ? buddy.compactWidth : buddy.width;
          return sum + width;
        }) +
        gap * (_buddies.length - 1);
    var x = (size.width - total) / 2;
    final rects = <Rect>[];
    for (final buddy in _buddies) {
      final width = widget.compact ? buddy.compactWidth : buddy.width;
      final height = widget.compact ? buddy.compactHeight : buddy.height;
      final top = widget.compact
          ? size.height - height
          : size.height * 0.72 - height;
      rects.add(Rect.fromLTWH(x, top, width, height));
      x += width + gap;
    }
    return rects;
  }

  @override
  void dispose() {
    widget.bus.mode.removeListener(_onMode);
    _pose.removeListener(_rebuild);
    _track.dispose();
    _pose.dispose();
    super.dispose();
  }
}
```

热重启。在宽窗口里点密码、点眼睛图标、再点回邮箱，对一下上面的顺序。窄屏可以点，但布局仍是第 8 步的上下排列。

---

## 第 10 步：手机上趴在表单上

做完能看到：窗口窄于 900 时，三个头靠在白色卡片上沿，眼睛看向下方。点密码框只闭眼，没有手。宽窗口仍是左边一排全身、右边表单。

替换 `login_screen.dart` 和 `character_stage.dart`。`cook_character.dart`、`login_form.dart` 不动。热重载即可；如果 `compact` 的分支看起来没换，热重启一次。

### 不要用 Column 把角色和表单接在一起

第 8 步的窄屏是「上面一块绿、下面一张表」。角色的脚在绿色区域的底边上，和卡片是分开的。

这一步窄屏改成一个宽 360 的 `Stack`：

- 舞台 `Positioned` 在顶部，高度 78
- 表单没有 `Positioned`，外面垫了 `padding top: 48`

Stack 的尺寸规则：有**没被 Positioned 的**孩子时，Stack 去包住那些孩子。这里没被定位的是表单（含那 48 像素的上边距），所以整叠的高度是「48 + 表单高度」。舞台被定位且写死了高度，不参与把 Stack 撑高。

绘制顺序就是 `children` 的顺序。表单写在后面，画在舞台上面。`Material` 的颜色是不透明的白，从 y = 48 开始把角色的下半截盖住。表单如果透明，身体会从卡片里透出来。表单如果写在舞台前面，头会画在卡片之上，盖住输入框。

外层这个 Stack 用 `Clip.none`。第 11 步进场时，头会从站位上方 28 像素飘下来，默认 `Clip.hardEdge` 会把刚露出卡片的那一截裁掉。

### 按眼睛对齐，不按脚对齐

手机上每个角色的 `top`：

```text
eyeLine = 36
top     = 36 - eyeCenterInBody(width).dy
```

眼睛的中心都放在舞台 y = 36。表单顶在 48，所以眼中心在卡片上沿上方 12 像素。身体从眼睛下面继续往下长，伸进卡片里被白底挡住。

露在卡片外面的是头顶那一截，由 `w` 决定：眼睛距头顶 `0.16w`，半圆高度是 `w / 2`。`w` 小的那个，眼睛离自己头顶更近，半圆也更矮，所以更像只探出头。`h` 决定身体往卡片里面伸多长，不决定眼睛在哪。

以舞台局部坐标估算（眼中心公式沿用第 2 步，`h` 用手机那一组）：

| `w` | `h` | 眼中心在身体里的 y | 角色 top | 半圆大约结束在 |
|---|---|---|---|---|
| 52 左 | 78 | 14 | 22 | 48，差不多齐卡片上沿 |
| 40 中 | 60 | 11 | 25 | 45，几乎只剩头 |
| 46 右 | 69 | 12 | 24 | 47 |

半圆高度是 `w / 2`，跟 `h` 无关。卡片从 48 开始盖。左边 `w` 较大，半圆底部几乎贴着卡片；中间 `w` 较小，半圆底部还在卡片上面一点。

### compact 时关掉追随

`compact == true` 时，第 6 步已经不启动追踪 `Ticker`。这一步把固定看点从「舞台中部」改成「舞台底边中点再往下 40」，和害羞时是同一个点。`_smooth` 是空的，`build` 直接用这个目标，瞳孔朝下，朝向表单。不需要平滑：目标不变。

同时：

- `lean` 仍是 0（第 7 步就定了）
- `hands` 传 `HandStyle.none`。密码时只闭眼，手不会伸进输入框
- 桌面的地面线、追随、手，都不变

### 源码：`login_screen.dart`

桌面方法和第 8 步相同。变的是 `_mobile`。

```dart
import 'package:cook_app/ui/auth/login/widgets/character_stage.dart';
import 'package:cook_app/ui/auth/login/widgets/gaze_bus.dart';
import 'package:cook_app/ui/auth/login/widgets/login_form.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _bus = GazeBus();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white1,
      body: LayoutBuilder(
        builder: (context, constraints) {
          final desktop = constraints.maxWidth >= 900;
          return MouseRegion(
            onEnter: (_) => _bus.pointerInside.value = true,
            onExit: (_) => _bus.pointerInside.value = false,
            onHover: (event) {
              _bus.pointerInside.value = true;
              _bus.look.value = event.position;
            },
            child: desktop ? _desktop() : _mobile(),
          );
        },
      ),
    );
  }

  Widget _desktop() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: ColoredBox(
            color: AppColors.green1,
            child: CharacterStage(bus: _bus, compact: false),
          ),
        ),
        SizedBox(
          width: 460,
          child: Center(
            child: SizedBox(width: 360, child: LoginForm(bus: _bus)),
          ),
        ),
      ],
    );
  }

  Widget _mobile() {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
        child: SizedBox(
          width: 360,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                height: 78,
                child: CharacterStage(bus: _bus, compact: true),
              ),
              Padding(
                padding: const EdgeInsets.only(top: 48),
                child: LoginForm(bus: _bus),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _bus.dispose();
    super.dispose();
  }
}
```

窄屏外面的 `Center` + `SingleChildScrollView` 是为了键盘弹起或窗口很矮时表单还能滚动。滚动的是整张卡片和头，头不会单独掉在屏幕外。

### 源码：`character_stage.dart`

相对第 9 步只有三处：`_target` 里手机和害羞看同一个下方的点；`_bodies` 里手机按眼睛对齐；`hands` 在手机上强制为 `none`。其余保持，下面仍是整份文件。

```dart
import 'package:cook_app/ui/auth/login/widgets/cook_character.dart';
import 'package:cook_app/ui/auth/login/widgets/gaze_bus.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

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
    color: AppColors.green3,
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
    required this.bus,
    required this.compact,
    super.key,
  });

  final GazeBus bus;
  final bool compact;

  @override
  State<CharacterStage> createState() => _CharacterStageState();
}

class _CharacterStageState extends State<CharacterStage>
    with TickerProviderStateMixin {
  late final Ticker _track;
  late final AnimationController _pose;

  final _smooth = <Offset>[];
  var _visualMode = GazeMode.idle;
  var _generation = 0;

  @override
  void initState() {
    super.initState();
    _pose = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 460),
      reverseDuration: const Duration(milliseconds: 240),
    );
    _track = createTicker(_onTick);
    widget.bus.mode.addListener(_onMode);
    _pose.addListener(_rebuild);
  }

  void _rebuild() {
    if (mounted) {
      setState(() {});
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _syncTicker();
  }

  @override
  void didUpdateWidget(CharacterStage oldWidget) {
    super.didUpdateWidget(oldWidget);
    _syncTicker();
  }

  void _syncTicker() {
    final run = !widget.compact;
    if (run && !_track.isActive) {
      _track.start();
    }
    if (!run && _track.isActive) {
      _track.stop();
      _smooth.clear();
    }
  }

  void _onTick(Duration _) {
    if (!mounted || widget.compact) {
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

  Offset _target(Size size, RenderBox? box) {
    if (widget.compact || _isShy(_visualMode)) {
      return Offset(size.width / 2, size.height + 40);
    }
    if (!widget.bus.pointerInside.value || box == null || !box.hasSize) {
      return Offset(size.width + 80, size.height * 0.48);
    }
    return box.globalToLocal(widget.bus.look.value);
  }

  void _onMode() {
    final next = widget.bus.mode.value;
    final generation = ++_generation;
    if (_isShy(next)) {
      setState(() => _visualMode = next);
      _pose.forward();
      return;
    }
    if (_isShy(_visualMode)) {
      _pose.reverse().whenComplete(() {
        if (!mounted || generation != _generation) {
          return;
        }
        setState(() => _visualMode = GazeMode.idle);
      });
    }
  }

  bool _isShy(GazeMode mode) =>
      mode == GazeMode.password || mode == GazeMode.passwordVisible;

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

  Widget _placed(int index, Rect body, Offset fallback) {
    final look = _smooth.length == _buddies.length ? _smooth[index] : fallback;
    final eye = body.topLeft + CookCharacterMetrics.eyeCenterInBody(body.width);
    final close = _interval(
      _pose.value,
      0.04 + index * 0.12,
      0.42 + index * 0.10,
      Curves.easeIn,
    );
    final handsT = _interval(
      _pose.value,
      0.18 + index * 0.10,
      0.78 + index * 0.06,
      Curves.easeOutBack,
    );
    final shut = switch (_visualMode) {
      GazeMode.password => 1.0,
      GazeMode.passwordVisible => 0.62,
      _ => 1.0,
    };
    final eyeOpen = 1 - close * shut;
    final handTarget = switch (_visualMode) {
      GazeMode.passwordVisible => 0.45,
      _ => 1.0,
    };
    final dx = look.dx - body.center.dx;
    final trackLean = (dx / 520).clamp(-1.0, 1.0) * 0.1;
    final lean = widget.compact
        ? 0.0
        : trackLean * (1 - _pose.value) + -0.05 * _pose.value;
    return Positioned(
      left: body.left,
      top: body.top,
      width: body.width,
      height: body.height,
      child: CookCharacter(
        color: _buddies[index].color,
        width: body.width,
        height: body.height,
        pupil: _pupil(look, eye),
        eyeOpen: eyeOpen.clamp(0.0, 1.0),
        handCover: _isShy(_visualMode) ? handsT * handTarget : 0,
        lean: lean,
        hands: widget.compact ? HandStyle.none : _buddies[index].hands,
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
    const gap = 28.0;
    final total = _buddies.fold<double>(0.0, (sum, buddy) {
          final width = widget.compact ? buddy.compactWidth : buddy.width;
          return sum + width;
        }) +
        gap * (_buddies.length - 1);
    var x = (size.width - total) / 2;
    final rects = <Rect>[];
    for (final buddy in _buddies) {
      final width = widget.compact ? buddy.compactWidth : buddy.width;
      final height = widget.compact ? buddy.compactHeight : buddy.height;
      final double top;
      if (widget.compact) {
        const eyeLine = 36.0;
        top = eyeLine - CookCharacterMetrics.eyeCenterInBody(width).dy;
      } else {
        top = size.height * 0.72 - height;
      }
      rects.add(Rect.fromLTWH(x, top, width, height));
      x += width + gap;
    }
    return rects;
  }

  @override
  void dispose() {
    widget.bus.mode.removeListener(_onMode);
    _pose.removeListener(_rebuild);
    _track.dispose();
    _pose.dispose();
    super.dispose();
  }
}
```

把窗口拉窄再拉宽。窄的时候头在卡片上，眼睛朝下；宽的时候恢复站立和追随。

---

## 第 11 步：眨眼、进场、减少动画

做完能看到：进入页面时三个人先后出现。桌面是从脚底下浮上来，手机是从头顶落下来。过一两秒，偶尔有一个人快速眨一下。点密码时不再眨眼。系统打开「减少动态效果」后，追随、进场、眨眼都没有过程，但点密码仍然会立刻闭眼。

只替换 `character_stage.dart`。这一步又在 `initState` 里创建控制器，**热重启**。

这一步的文件就是最终结果。

### 眨眼不是闭眼

害羞那条时间线表示「我没在看密码」。眨眼是平时的小动作。两件事如果乘在一起不设门槛，会互相拆台。

每个角色一个 `Timer`，不是 `Ticker`。眨眼只有两个状态：睁着 `_blink[i] = 1`，闭上 `_blink[i] = 0`，中间不插值。100 毫秒后再睁开。这种两拍的事用定时器就够。`AnimationController` 是为了有中间帧。

间隔是 `1600 + 0..2199` 毫秒，大约 1.6 到 3.8 秒，三个人各自随机，所以不会一起眨。

到点时如果正在害羞，或者系统要求减少动画：这次不眨，立刻再预约下一次。定时器不拆掉。这样从密码框回到邮箱之后，下一次到点仍会眨。如果害羞时把定时器停死，还得在模式变化时记得重新 `arm`，多一条路径。

最终睁眼程度：

```text
poseOpen = 1 - close × shut          // 第 9 步的眼皮
害羞时   eyeOpen = poseOpen
平时     eyeOpen = poseOpen × _blink[i]
```

密码可见时 `poseOpen` 最终是 0.38。如果这时还乘眨眼，眨完会从 0 弹回 0.38，看起来像把刚闭上的眼睛又睁开一条缝。所以害羞时不乘 `_blink`。

`dispose` 里把三个 `Timer` 都 `cancel`。不定时器会在页面销毁后仍 `setState`。

### 进场是第三个 Ticker

再一个 `AnimationController`，时长 540ms，只有正向。加上追随 `Ticker` 和闭眼控制器，这个 `State` 上有三个 `Ticker`。

同一个人仍用 `_interval`，曲线用 `Curves.easeOutCubic`（先快后慢，停得稳，并且输出留在 0 到 1）。540ms 上：

| i | 开始 | 结束 |
|---|---|---|
| 0 | 0 | 0.72 → 389ms |
| 1 | 0.12 → 65ms | 0.80 → 432ms |
| 2 | 0.24 → 130ms | 0.88 → 475ms |

```text
travel = 手机 ? -28 : 36
dy     = (1 - appear) × travel
```

`appear = 0` 时，桌面 `dy = 36`，人在站位下方 36 像素；手机 `dy = -28`，人在站位上方 28 像素。`appear = 1` 时 `dy = 0`，回到 `_bodies` 算出来的位置。

外面套 `Opacity(opacity: appear)`。位移用 `Transform.translate`，不要去改 `Positioned.top`。站位矩形保持不变，只是这一帧画偏了。舞台和第 10 步那个外层 Stack 都是 `Clip.none`，偏出去的部分才看得见。

`easeOutCubic` 不会超出 0 到 1。`Opacity` 仍 `clamp` 一次：以后如果把曲线换成会冲过 1 的，调试断言不会先炸。

### 减少动态效果

`MediaQuery.disableAnimationsOf(context)` 为 true 时，用户在系统里打开了「减少动态效果」。这是一个继承组件。

`initState` 里不能读它。`dependOnInheritedWidgetOfExactType` 在 `initState` 完成前调用会直接抛错。放在 `didChangeDependencies`。这个方法在 `initState` 之后一定会走一次，之后只要依赖变了（文字缩放、键盘、系统动画开关）还会再走。

所以进场用 `_booted` 只播放一次。没有这个标记的话，每次依赖变化都会 `forward()`，人会反复从脚下冒出来。

减少动画时：

- 不 `start` 追踪 `Ticker`。已经在跑就 `stop`，并清空 `_smooth`。清空发生在 `didChangeDependencies` 里，紧接着的那次 `build` 会走 `_target`，不用再 `setState`
- 桌面的休息点和指针离开时相同：舞台右边缘再往外 80 像素。因为没有时钟，鼠标移动也不会重建，瞳孔就停在看右侧
- 手机本来就不追，看点仍是舞台下方
- 进场控制器直接 `_enter.value = 1`，不播位移
- 密码闭眼把 `_pose.value` 设成 1，离开时设成 0，并立刻把 `_visualMode` 改回 `idle`

闭眼仍然要发生。那是在告诉用户「密码被挡住了」，只是不做过程。直接写 `.value` 也会通知监听者，画面会跳到终态。

`_onTick` 里再判断一次 `_reduceMotion`。`stop()` 之后可能还有已经排好的一帧，那一帧直接返回。

### 源码：`character_stage.dart`

```dart
import 'dart:async';
import 'dart:math' as math;

import 'package:cook_app/ui/auth/login/widgets/cook_character.dart';
import 'package:cook_app/ui/auth/login/widgets/gaze_bus.dart';
import 'package:cook_app/ui/core/themes/colors.dart';
import 'package:flutter/material.dart';

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
    color: AppColors.green3,
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
    required this.bus,
    required this.compact,
    super.key,
  });

  final GazeBus bus;
  final bool compact;

  @override
  State<CharacterStage> createState() => _CharacterStageState();
}

class _CharacterStageState extends State<CharacterStage>
    with TickerProviderStateMixin {
  late final Ticker _track;
  late final AnimationController _pose;
  late final AnimationController _enter;

  final _smooth = <Offset>[];
  final _blink = [1.0, 1.0, 1.0];
  final _blinkTimers = List<Timer?>.filled(3, null);
  final _random = math.Random();

  var _visualMode = GazeMode.idle;
  var _generation = 0;
  var _reduceMotion = false;
  var _booted = false;

  @override
  void initState() {
    super.initState();
    _pose = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 460),
      reverseDuration: const Duration(milliseconds: 240),
    );
    _enter = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 540),
    );
    _track = createTicker(_onTick);
    widget.bus.mode.addListener(_onMode);
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
      for (var i = 0; i < _buddies.length; i++) {
        _armBlink(i);
      }
    }
    _syncTicker();
  }

  @override
  void didUpdateWidget(CharacterStage oldWidget) {
    super.didUpdateWidget(oldWidget);
    _syncTicker();
  }

  void _syncTicker() {
    final run = !widget.compact && !_reduceMotion;
    if (run && !_track.isActive) {
      _track.start();
    }
    if (!run && _track.isActive) {
      _track.stop();
      _smooth.clear();
    }
  }

  void _onTick(Duration _) {
    if (!mounted || widget.compact || _reduceMotion) {
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

  Offset _target(Size size, RenderBox? box) {
    if (widget.compact || _isShy(_visualMode)) {
      return Offset(size.width / 2, size.height + 40);
    }
    if (_reduceMotion ||
        !widget.bus.pointerInside.value ||
        box == null ||
        !box.hasSize) {
      return Offset(size.width + 80, size.height * 0.48);
    }
    return box.globalToLocal(widget.bus.look.value);
  }

  void _onMode() {
    final next = widget.bus.mode.value;
    final generation = ++_generation;
    if (_isShy(next)) {
      setState(() => _visualMode = next);
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
        setState(() => _visualMode = GazeMode.idle);
        return;
      }
      _pose.reverse().whenComplete(() {
        if (!mounted || generation != _generation) {
          return;
        }
        setState(() => _visualMode = GazeMode.idle);
      });
    }
  }

  bool _isShy(GazeMode mode) =>
      mode == GazeMode.password || mode == GazeMode.passwordVisible;

  void _armBlink(int index) {
    _blinkTimers[index]?.cancel();
    _blinkTimers[index] = Timer(
      Duration(milliseconds: 1600 + _random.nextInt(2200)),
      () {
        if (!mounted) {
          return;
        }
        if (_isShy(_visualMode) || _reduceMotion) {
          _armBlink(index);
          return;
        }
        setState(() => _blink[index] = 0);
        _blinkTimers[index] = Timer(const Duration(milliseconds: 100), () {
          if (!mounted) {
            return;
          }
          setState(() => _blink[index] = 1);
          _armBlink(index);
        });
      },
    );
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

  Widget _placed(int index, Rect body, Offset fallback) {
    final look = _smooth.length == _buddies.length ? _smooth[index] : fallback;
    final eye = body.topLeft + CookCharacterMetrics.eyeCenterInBody(body.width);
    final close = _interval(
      _pose.value,
      0.04 + index * 0.12,
      0.42 + index * 0.10,
      Curves.easeIn,
    );
    final handsT = _interval(
      _pose.value,
      0.18 + index * 0.10,
      0.78 + index * 0.06,
      Curves.easeOutBack,
    );
    final shut = switch (_visualMode) {
      GazeMode.password => 1.0,
      GazeMode.passwordVisible => 0.62,
      _ => 1.0,
    };
    final poseOpen = 1 - close * shut;
    final eyeOpen = _isShy(_visualMode) ? poseOpen : poseOpen * _blink[index];
    final handTarget = switch (_visualMode) {
      GazeMode.passwordVisible => 0.45,
      _ => 1.0,
    };
    final dx = look.dx - body.center.dx;
    final trackLean = (dx / 520).clamp(-1.0, 1.0) * 0.1;
    final lean = widget.compact
        ? 0.0
        : trackLean * (1 - _pose.value) + -0.05 * _pose.value;
    final appear = _interval(
      _enter.value,
      index * 0.12,
      0.72 + index * 0.08,
      Curves.easeOutCubic,
    );
    final travel = widget.compact ? -28.0 : 36.0;
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
            color: _buddies[index].color,
            width: body.width,
            height: body.height,
            pupil: _pupil(look, eye),
            eyeOpen: eyeOpen.clamp(0.0, 1.0),
            handCover: _isShy(_visualMode) ? handsT * handTarget : 0,
            lean: lean,
            hands: widget.compact ? HandStyle.none : _buddies[index].hands,
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
    const gap = 28.0;
    final total = _buddies.fold<double>(0.0, (sum, buddy) {
          final width = widget.compact ? buddy.compactWidth : buddy.width;
          return sum + width;
        }) +
        gap * (_buddies.length - 1);
    var x = (size.width - total) / 2;
    final rects = <Rect>[];
    for (final buddy in _buddies) {
      final width = widget.compact ? buddy.compactWidth : buddy.width;
      final height = widget.compact ? buddy.compactHeight : buddy.height;
      final double top;
      if (widget.compact) {
        const eyeLine = 36.0;
        top = eyeLine - CookCharacterMetrics.eyeCenterInBody(width).dy;
      } else {
        top = size.height * 0.72 - height;
      }
      rects.add(Rect.fromLTWH(x, top, width, height));
      x += width + gap;
    }
    return rects;
  }

  @override
  void dispose() {
    widget.bus.mode.removeListener(_onMode);
    _pose.removeListener(_rebuild);
    _enter.removeListener(_rebuild);
    for (final timer in _blinkTimers) {
      timer?.cancel();
    }
    _track.dispose();
    _pose.dispose();
    _enter.dispose();
    super.dispose();
  }
}
```

热重启后看进场。等几秒看眨眼。点进密码时眨眼应停。macOS 或浏览器里打开「减弱动态效果」再进一次登录页：人直接出现在终点，瞳孔不追鼠标，点密码会马上闭眼、没有抬手的过程。

登录按钮仍然是空的。动画确认之后，再在 `onPressed` 里调已有的 `AuthRepository`。

---

## 对不上的时候

- 第 1 步色块是空白：`Row` / `Column` 加上 `crossAxisAlignment: CrossAxisAlignment.stretch`。没有它时，`ColoredBox` 在交叉轴上会缩成 0。
- 瞳孔不动：`MouseRegion` 要包住左右两边。窗口宽度小于 900 时本来就不跟鼠标。加过 `Ticker` 或改过 `initState` 之后要热重启。
- 报 `SingleTickerProviderStateMixin can only be used once`：换成 `TickerProviderStateMixin`。闭眼和进场的控制器各自还要一个 Ticker。
- 打字卡：鼠标的 `setState` 写进了 `LoginScreen`。看点只让 `CharacterStage` 的 `Ticker` 去 `setState`。表单不要监听 `look`。
- 离开密码框时眼睛突然睁开，或手突然消失：`mode` 已经是 `idle` 就立刻拿它算眼皮和手了。等 `reverse` 结束再把 `_visualMode` 改回 `idle`。
- 快速切换焦点时，闭眼做到一半又睁开：旧的 `whenComplete` 还在跑。回调里核对 `_generation`。
- 手和眼睛错位：眼睛坐标写了两套。舞台和角色都用 `CookCharacterMetrics`。
- 手没有冲过终点就停住：`easeOutBack` 的值先被 `clamp` 再拿去 `Offset.lerp` 了。位置用原始值，只把 `Opacity` 夹到 0 到 1。
- `Opacity` 断言失败：传进去的值超过了 1。`easeOutBack` 会这样。
- 手机上身体露在卡片上面：表单要画在角色之后，并且背景是不透明的白。窄屏不要再用 `Column` 把舞台和表单上下排开。
- 进场被切掉一截：舞台和窄屏那个 `Stack` 都要 `clipBehavior: Clip.none`。
- 每次键盘弹出，角色都重新从脚下冒出来：`didChangeDependencies` 里没有 `_booted`，进场被重复 `forward()`。
