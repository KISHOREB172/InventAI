# InventAI Android

The native Android Studio project is in `frontend/android` and uses Capacitor to package the React application.

## Open and run

1. Install Android Studio with its bundled JDK and Android SDK 36.
2. Start the FastAPI backend on the computer:

   ```powershell
   cd backend
   .\venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000
   ```

3. From `frontend`, synchronize web changes:

   ```powershell
   npm run android:sync
   ```

4. Open the `frontend/android` directory in Android Studio, select an emulator, and run the `app` configuration.

The Android emulator reaches the local backend at `http://10.0.2.2:8000`. For a physical phone or deployed backend, build with a reachable API address:

```powershell
$env:VITE_API_URL="https://api.example.com"
npm run android:sync
```

For a physical phone during local development, replace the example URL with the computer's LAN IP and update the Android network security policy if you use plain HTTP. HTTPS is recommended for release builds.
