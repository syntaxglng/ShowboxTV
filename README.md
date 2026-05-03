# 📺 Febbox Private Cookie Loader

![Platform](https://img.shields.io/badge/platform-Android-green)
![Status](https://img.shields.io/badge/status-active-success)
![Setup](https://img.shields.io/badge/setup-easy-blue)

Load and manage your private Febbox cookies using a lightweight local
HTTP server and custom provider configuration.

------------------------------------------------------------------------

## ✨ Features

-   🔐 Load private Febbox cookies securely\
-   🌐 Serve cookies locally via HTTP\
-   ⚡ Simple and quick setup\
-   📁 Support for multiple cookies\
-   🛠 Easy integration with provider files

------------------------------------------------------------------------

## 📦 Requirements

-   Android device\
-   Febbox cookie\
-   Simple HTTP Server (Android app)

------------------------------------------------------------------------

## 🚀 Setup Guide

### 1. Create Cookie File

Create a new `.txt` file and paste your Febbox cookie inside.

    cookie.txt

------------------------------------------------------------------------

### 2. Install HTTP Server

Download and install Simple HTTP Server from the Play Store.

------------------------------------------------------------------------

### 3. Configure Server

-   Open the app\
-   Set the root directory to the folder containing `cookie.txt`\
-   Start the server\
-   Copy the generated IP address

Example:

    http://192.168.1.100:8080/cookie.txt

------------------------------------------------------------------------

### 4. Update Provider File

-   Fork this repository\
-   Navigate to:

```{=html}
<!-- -->
```
    providers/showbox.js

-   Replace the cookie URL:

```{=html}
<!-- -->
```
    const COOKIE_URL = "http://192.168.1.100:8080/cookie.txt";

------------------------------------------------------------------------

### 5. Load Cookie

Your private cookie is now ready to use.

------------------------------------------------------------------------

## 🔁 Multiple Cookies Support

-   Create additional files (`cookie2.txt`, `cookie3.txt`)\
-   Serve them via the HTTP server\
-   Update provider configuration

------------------------------------------------------------------------

## ⚠️ Notes

-   Ensure both devices are on the same network\
-   You can also install app on Android TV.
-   Keep cookies private\
-   Server must be running\
-   IP may change on reconnect

------------------------------------------------------------------------

## 🛠 Troubleshooting

**Cookie not loading?** - Check server is running\
- Verify IP address\
- Confirm file path

**Connection failed?** - Ensure same Wi-Fi network\
- Restart server

------------------------------------------------------------------------

## 📄 License

For personal use only.
