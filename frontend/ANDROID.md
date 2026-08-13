# InventAI Android

The native Android Studio project is in `frontend/android` and uses Capacitor to package the React application.

## Open and run

1. Install Android Studio with its bundled JDK and Android SDK 36.
2. Start the FastAPI backend on the computer:

   ```powershell
   cd backend
   .\venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000
   ```

3. From `frontend`, point the debug build at the emulator bridge and synchronize web changes:

   ```powershell
   $env:VITE_API_URL="http://10.0.2.2:8000"
   npm run android:sync
   ```

4. Open the `frontend/android` directory in Android Studio, select an emulator, and run the `app` configuration.

The Android emulator reaches the local backend at `http://10.0.2.2:8000`. That host is the only cleartext exception, and it exists only in the debug resource set. When no build-time address is supplied, native builds use the deployed InventAI HTTPS API. For a physical phone, use an HTTPS development tunnel. For another deployed backend, build with its HTTPS API address:

```powershell
$env:VITE_API_URL="https://api.example.com"
npm run android:sync
```

Release builds reject mixed content and cleartext traffic. Do not add LAN IPs or development hosts to the production network policy.

## Release build

Android metadata is `3.0.0` with version code `30000`. Future releases must increase the version code.

Release signing is intentionally required and secrets are never stored in this repository. Create and securely back up one long-lived release keystore, then provide these values through environment variables or the user-level Gradle properties file at `%USERPROFILE%\.gradle\gradle.properties`:

```powershell
$env:INVENTAI_RELEASE_STORE_FILE="C:\secure\inventai-release.jks"
$env:INVENTAI_RELEASE_STORE_PASSWORD="<secret>"
$env:INVENTAI_RELEASE_KEY_ALIAS="inventai"
$env:INVENTAI_RELEASE_KEY_PASSWORD="<secret>"
$env:VITE_API_URL="https://api.example.com"
```

The tag-triggered GitHub Actions release workflow requires repository secrets named `INVENTAI_RELEASE_KEYSTORE_BASE64`, `INVENTAI_RELEASE_STORE_FILE` (a filename such as `inventai-release.jks`), `INVENTAI_RELEASE_STORE_PASSWORD`, `INVENTAI_RELEASE_KEY_ALIAS`, and `INVENTAI_RELEASE_KEY_PASSWORD`. The optional repository Actions variable `VITE_API_URL` must be a non-local HTTPS URL; it defaults to `https://inventai-api-scx1.onrender.com`. Pushing a `v*` tag builds and verifies the signed release APK, then attaches it to that tag's GitHub Release. The workflow never creates signing keys or substitutes a debug APK.

Never place the keystore or passwords inside the project. Losing the release key prevents trusted updates to existing installations. The APKs published before 3.0.0 used a debug certificate, so they cannot be upgraded in place to the properly signed release; users must uninstall that debug build once.

Build the complete release from `frontend`:

```powershell
.\android\prepare-release.ps1
```

The release script requires a non-local HTTPS API, creates a clean Vite build, removes only the generated `android/app/src/main/assets/public` directory, runs Capacitor sync, verifies that no stale hashed assets remain, runs unit tests and Android lint, validates signing, and builds a clean release APK. The output is `android/app/build/outputs/apk/release/app-release.apk`.

For local native verification without a signing key:

```powershell
.\android\prepare-release.ps1 -ApiUrl "https://inventai-api-scx1.onrender.com" -SkipReleaseBuild
```

This performs the same clean asset synchronization and stale-bundle check, runs the Android tests and lint, and creates an installable debug APK without pretending it is a production release.

To check signing configuration without creating an APK:

```powershell
.\android\gradlew.bat -p .\android validateReleaseSigning
```
