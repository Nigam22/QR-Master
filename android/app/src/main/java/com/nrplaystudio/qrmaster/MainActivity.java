package com.nrplaystudio.qrmaster;

import android.Manifest;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebChromeClient.FileChooserParams;
import android.webkit.WebView;
import android.view.KeyEvent;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.content.pm.PackageManager;
import android.widget.Toast;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    private static final int CAMERA_PERMISSION_REQUEST_CODE = 1001;
    private boolean isAppInBackground = false;
    private boolean cameraPermissionRequested = false;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Set the theme to transparent after splash screen is shown
        setTheme(R.style.AppTheme_Transparent);
        
        super.onCreate(savedInstanceState);
        
        // Configure WebView for camera access AND keep Capacitor's default behavior (file chooser, etc.)
        // Using plain WebChromeClient can break <input type="file"> on Android.
        this.bridge.getWebView().setWebChromeClient(new BridgeWebChromeClient(this.bridge) {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                // Handle permission requests from the web view
                for (String resource : request.getResources()) {
                    if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                        // Request camera permission
                        if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) 
                            != PackageManager.PERMISSION_GRANTED) {
                            ActivityCompat.requestPermissions(MainActivity.this, 
                                new String[]{Manifest.permission.CAMERA}, 
                                CAMERA_PERMISSION_REQUEST_CODE);
                            cameraPermissionRequested = true;
                        } else {
                            // Permission already granted
                            request.grant(request.getResources());
                        }
                        return;
                    }
                }
                // For other permissions, use default handling
                super.onPermissionRequest(request);
            }

            @Override
            public boolean onShowFileChooser(
                WebView webView,
                ValueCallback<Uri[]> filePathCallback,
                FileChooserParams fileChooserParams
            ) {
                // Delegate to Capacitor so "Scan from Gallery" (file picker) works.
                return super.onShowFileChooser(webView, filePathCallback, fileChooserParams);
            }
        });
    }
    
    @Override
    public void onPause() {
        super.onPause();
        isAppInBackground = true;
    }
    
    @Override
    public void onResume() {
        super.onResume();
        isAppInBackground = false;
        
        // Request camera permission when app resumes if not already requested
        if (!cameraPermissionRequested) {
            requestCameraPermission();
        }
    }
    
    // Handle hardware back button
    @Override
    public void onBackPressed() {
        // Always navigate to home screen when back button is pressed
        // Use JavaScript to communicate with the web app
        this.bridge.getWebView().evaluateJavascript(
            "window.location.pathname !== '/home' ? (window.location.href = '/home', true) : false;",
            result -> {
                // If result is \"false\", we're already on home screen, so exit app
                if ("false".equals(result)) {
                    finish();
                }
            }
        );
    }
    
    // Method to check if app was in background
    public boolean wasInBackground() {
        return isAppInBackground;
    }
    
    private void requestCameraPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) 
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, 
                new String[]{Manifest.permission.CAMERA}, 
                CAMERA_PERMISSION_REQUEST_CODE);
            cameraPermissionRequested = true;
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == CAMERA_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // Permission granted
                Toast.makeText(this, "Camera permission granted", Toast.LENGTH_SHORT).show();
                cameraPermissionRequested = true;
            } else {
                // Permission denied
                Toast.makeText(this, "Camera permission denied. Please enable it in Settings.", Toast.LENGTH_LONG).show();
            }
        }
    }
}


