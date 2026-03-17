import Foundation
import DeviceCheck
import CryptoKit

@objc(AppAttestModule)
class AppAttestModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc func getAttestationToken(
    _ challenge: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard DCAppAttestService.shared.isSupported else {
      reject("NOT_SUPPORTED", "App Attest not supported", nil)
      return
    }

    DCAppAttestService.shared.generateKey { keyId, error in
      if let error = error {
        reject("KEY_ERROR", error.localizedDescription, error)
        return
      }

      guard let keyId = keyId else {
        reject("KEY_ERROR", "KeyId nil aaya", nil)
        return
      }

      let challengeData = challenge.data(using: .utf8)!
      let hash = Data(SHA256.hash(data: challengeData))

      DCAppAttestService.shared.attestKey(
        keyId,
        clientDataHash: hash
      ) { attestation, error in

        if let error = error {
          reject("ATTEST_ERROR", error.localizedDescription, error)
          return
        }

        guard let attestation = attestation else {
          reject("ATTEST_ERROR", "Attestation nil aaya", nil)
          return
        }

        let token = attestation.base64EncodedString()
        resolve(token)
      }
    }
  }
}