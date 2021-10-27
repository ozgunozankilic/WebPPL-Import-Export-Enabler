# WebPPL Import/Export Enabler

## About
[WebPPL.org](http://webppl.org/) provides an online editor to write and run WebPPL code. However, it has no import capabilities and only allows generating MD-formatted text for one file at a time.

This lightweight Google Chrome extension adds import and export functionalities by parsing files and manipulating the local storage. One can export a notebook as an .md file or the entire workspace as a .json file. It is possible to later import multiple .md files or the workspace at once, making working with the online editor even more portable and convenient.

The extension is tested in Chrome, Opera, and Brave. It is likely to work in other browsers as well, especially Chromium-based ones. It seems making adjustments in the manifest is necessary for Firefox.

## Usage

The current version is waiting for approval from Chrome Web Store. In the meantime, you can download the latest release from [here](https://github.com/ozgunozankilic/WebPPL-Import-Export-Enabler/releases/download/v1.0.2/webppl_import_export_enabler_v1.0.2.zip).

If you choose to manually install it, you will need to enable the developer mode and drag the .zip file to the extensions panel. This step depends on your browser. For Chrome, visit [chrome://extensions/](chrome://extensions/).

![ss-github2](https://user-images.githubusercontent.com/19360437/139063345-94d047ab-3c50-493c-bb32-46825cac50e4.jpg)

After installing the extension, you should see two new buttons in the editor:

![ss1](https://user-images.githubusercontent.com/19360437/138622532-15bcecda-7ab6-4d98-a6f2-0327dd96e929.jpg)

After clicking on these, you can choose to import/export an individual file or a workspace:

![ss2](https://user-images.githubusercontent.com/19360437/138622623-85eb2c35-047c-4ee1-9488-fca7f25fd8dd.jpg)
![ss3](https://user-images.githubusercontent.com/19360437/138622628-156cdd27-10b5-4553-ab0e-a9693b5ce451.jpg)
