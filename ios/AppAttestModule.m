#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AppAttestModule, NSObject)

RCT_EXTERN_METHOD(
  getAttestationToken:(NSString *)challenge
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

@end