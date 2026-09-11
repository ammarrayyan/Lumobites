import UIKit
import Capacitor

// Disables the WKWebView's native rubber-band bounce so fixed-position elements
// (e.g. the bottom nav bar) don't visually shift during scroll-boundary overscroll.
// CSS overscroll-behavior does not reliably suppress this at the native scroll-view level.
class MainViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
    }

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        applyScrollLock()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        applyScrollLock()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        applyScrollLock()
    }

    private func applyScrollLock() {
        // App cream theme background #F7F3EE (247, 243, 238)
        let creamColor = UIColor(red: 247.0/255.0, green: 243.0/255.0, blue: 238.0/255.0, alpha: 1.0)
        self.view.backgroundColor = creamColor
        
        let wv = self.bridge?.webView ?? self.webView
        wv?.backgroundColor = creamColor
        wv?.isOpaque = true
        
        let sv = self.bridge?.webView?.scrollView ?? self.webView?.scrollView
        sv?.backgroundColor = creamColor
        sv?.bounces = false
        sv?.alwaysBounceVertical = false
        sv?.alwaysBounceHorizontal = false
    }
}
