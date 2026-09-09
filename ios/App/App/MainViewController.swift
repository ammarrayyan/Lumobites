import UIKit
import Capacitor

// Disables the WKWebView's native rubber-band bounce so fixed-position elements
// (e.g. the bottom nav bar) don't visually shift during scroll-boundary overscroll.
// CSS overscroll-behavior does not reliably suppress this at the native scroll-view level.
class MainViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        webView?.scrollView.bounces = false
    }
}
