import Cocoa
import FlutterMacOS

class MainFlutterWindow: NSWindow {
  override func awakeFromNib() {
    let flutterViewController = FlutterViewController()
    self.contentViewController = flutterViewController

    let visible = (self.screen ?? NSScreen.main)?.visibleFrame ?? self.frame
    let width = min(max(visible.width * 0.7, 960), 1440)
    let height = min(max(visible.height * 0.75, 640), 900)
    let frame = NSRect(
      x: visible.midX - width / 2,
      y: visible.midY - height / 2,
      width: width,
      height: height
    )
    self.setFrame(frame, display: true)

    RegisterGeneratedPlugins(registry: flutterViewController)

    super.awakeFromNib()
  }
}
