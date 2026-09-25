/**
 * JobFlux AI — Android shell (thin WebView wrapper, NOT a bundled app).
 *
 * NOTE: intentionally dependency-free — no @capacitor/* packages are
 * installed in this repo. APK assembly happens on the builder machine.
 *
 * Principles (per product decision):
 * - 100% dynamic: the shell loads https://jobfluxai.vercel.app live.
 *   Server down => the shell shows the offline fallback, nothing cached.
 * - No reinstall ever for web changes: redeploy the site, shell reflects it.
 * - Distribution is in-app only: /api/app/download (apk_access gated).
 *   Never publish this to the Play Store.
 *
 * One-time builder setup (needs Android SDK + keystore, ~15 min):
 *   npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/push-notifications
 *   npx cap init "JobFlux AI" ai.jobflux.app --web-dir=public
 *   npx cap add android
 *   npx cap sync android
 *   cd android && ./gradlew assembleRelease   # sign with your keystore
 *   Upload the APK to your file host, set APK_DOWNLOAD_URL in Vercel env.
 */
const config = {
  appId: 'ai.jobflux.app',
  appName: 'JobFlux AI',
  webDir: 'public',
  server: {
    url: 'https://jobfluxai.vercel.app',
    cleartext: false,
    // Never fall back to bundled files: if the server is unreachable the
    // WebView shows the native offline page (blank + logo), not stale content.
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false
  }
}

export default config
