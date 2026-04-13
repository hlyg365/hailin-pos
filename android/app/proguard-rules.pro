# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Keep Capacitor classes
-keep class com.getcapacitor.** { *; }
-keep class org.apache.cordova.** { *; }
-keep class io.ionic.** { *; }
-keep class androidx.webkit.** { *; }

# Keep native libraries
-keep class * extends androidx.webkit.WebViewChromium { *; }
-keep class * implements androidx.webkit.WebViewClient { *; }

# Keep JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Remove logging in release
-assumenosideeffects class android.util.Log {
    public static int v(...);
    public static int d(...);
    public static int i(...);
}

# Keep JS interface
-keepclassmembers class fqcn.of.javascript.interface.for.webview {
   public *;
}

# Keep Parcelable classes
-keepclassmembers class * implements android.os.Parcelable {
    public static final ** CREATOR;
}
