import UIKit
import Capacitor

// Disables the WKWebView's native rubber-band bounce so fixed-position elements
// (e.g. the bottom nav bar) don't visually shift during scroll-boundary overscroll.
// CSS overscroll-behavior does not reliably suppress this at the native scroll-view level.
class MainViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        webView?.scrollView.bounces = false
        webView?.scrollView.alwaysBounceVertical = false
        webView?.scrollView.alwaysBounceHorizontal = false
    }
}
