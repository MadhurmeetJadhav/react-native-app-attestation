package com.reactnativeappattestation

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.IntegrityTokenRequest

class PlayIntegrityModule(reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "PlayIntegrityModule"

    @ReactMethod
    fun getAttestationToken(nonce: String, promise: Promise) {
        try {
            val integrityManager = IntegrityManagerFactory
                .create(reactApplicationContext)

            val request = IntegrityTokenRequest.builder()
                .setNonce(nonce)
                .build()

            integrityManager
                .requestIntegrityToken(request)
                .addOnSuccessListener { response ->
                    promise.resolve(response.token())
                }
                .addOnFailureListener { error ->
                    promise.reject("INTEGRITY_ERROR", error.message)
                }

        } catch (e: Exception) {
            promise.reject("UNEXPECTED_ERROR", e.message)
        }
    }
}