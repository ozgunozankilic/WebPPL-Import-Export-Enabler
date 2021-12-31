# WebPPL Import/Export Enabler

## About
[WebPPL.org](http://webppl.org/) provides an online editor to write and run WebPPL code. However, it has no import capabilities and only allows generating MD-formatted text for one file at a time. Also, using datasets require some manual work.

This lightweight Google Chrome extension adds import and export functionalities by parsing files and manipulating the local storage. One can export a notebook as an .md file or the entire workspace as a .json file. It is possible to later import multiple .md files or the workspace at once, making working with the online editor even more portable and convenient. Furthermore, it allows importing CSV or JSON data as a variable that can be used in WebPPL.

The extension is tested in Chrome, Opera, and Brave. It is likely to work in other browsers as well, especially Chromium-based ones. It seems making adjustments in the manifest is necessary for Firefox.

## Usage

You can install it from [Chrome Web Store](https://chrome.google.com/webstore/detail/webppl-importexport-enabl/jjkpdhpdcnhcelpklajpmabbandclpeo) using browsers that support Chrome Web Store. Updates are published there a few days behind as the approval procedure takes time, but you would automatically get the updates. Alternatively, you can download the latest release from [here](https://github.com/ozgunozankilic/WebPPL-Import-Export-Enabler/releases/download/v1.1.1/webppl_import_export_enabler_v1.1.1.zip).

If you choose to manually install it, you will need to enable the developer mode and drag the .zip file to the extensions panel. This step depends on your browser. For Chrome, visit [chrome://extensions/](chrome://extensions/).

![ss-github2](https://user-images.githubusercontent.com/19360437/139063345-94d047ab-3c50-493c-bb32-46825cac50e4.jpg)

After installing the extension, you should see two new buttons in the editor:

![v1 1 0_ss1](https://user-images.githubusercontent.com/19360437/147831188-9baf56fe-21b5-402e-9d88-19258fb8da7d.jpg)

Clicking on these, you can import/export a file/workspace or and import a dataset as a variable:

![v1 1 0_ss2](https://user-images.githubusercontent.com/19360437/147831219-a2260811-7636-4344-9c03-ac5a1dc0d6a6.jpg)
![v1 1 0_ss3](https://user-images.githubusercontent.com/19360437/147831221-c56fb49f-0151-4dd5-bedb-68e1ae061bf9.jpg)
![v1 1 0_ss4](https://user-images.githubusercontent.com/19360437/147831226-6435023d-28e8-4c5f-aa1a-aa7ae9c28241.jpg)
![v1 1 0_ss5](https://user-images.githubusercontent.com/19360437/147831228-3c2b1d1e-6d9e-4565-b7b8-cb77a487b9fd.jpg)
