# UXP distribution package

`UnityAssetTrim-Panel-1.1.0.ccx` was packaged with Adobe's official UXP Developer Tools CLI against Photoshop 25.2.0. Its stable independent-distribution ID is `com.sakeka56.unityassettrim`.

The Windows build verifies that every packaged file matches the current `uxp/` source before copying the CCX to `dist/`. The verified package is checked in so Windows build machines do not need a licensed Photoshop host simply to reproduce the installer and release artifacts.

After changing UXP source, regenerate the package using Adobe UXP Developer Tool's **Package** action, or `uxp plugin package --manifest uxp/manifest.json --outputPath <existing-directory>`, then replace the corresponding versioned CCX here. Never include `.uxprc` or development sessions in the package.
