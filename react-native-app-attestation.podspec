require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-app-attestation"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/madhurmeetjadhav/react-native-app-attestation"
  s.license      = "MIT"
  s.authors      = { "Madhurmeet Jadhav" => "madhurmeetj@gmail.com" }
  s.platforms    = { :ios => "14.0" }
  s.source       = {
    :git => "https://github.com/madhurmeetjadhav/react-native-app-attestation.git",
    :tag => "#{s.version}"
  }

  s.source_files = "ios/**/*.{h,m,mm,swift}"

  s.dependency "React-Core"

  # Autolinking support
  s.pod_target_xcconfig = {
    "SWIFT_VERSION" => "5.0",
    "DEFINES_MODULE" => "YES"
  }
end