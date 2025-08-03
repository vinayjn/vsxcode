# Changelog

All notable changes to the VSXcode extension will be documented in this file.

## [0.0.1] - 2024-01-XX

### Added
- Initial release of VSXcode extension
- **Core Xcode Integration**
  - Run iOS/macOS apps with `Cmd+R` shortcut
  - Build apps with `Cmd+B` shortcut
  - Clean build functionality
  - Automatic Xcode project detection (`.xcodeproj` and `.xcworkspace`)

- **Scheme Management**
  - Automatic scheme discovery from Xcode projects
  - Interactive scheme selection via command palette
  - Support for both project and workspace schemes

- **Device Management**
  - List available iOS simulators
  - Interactive device selection
  - Support for iPhone, iPad, and Mac simulators

- **User Interface**
  - **Sidebar Panel** - Dedicated VSXcode panel with visual buttons for all actions
  - Status bar integration showing current project
  - Command palette integration with VSXcode commands
  - Context menu integration for Xcode projects
  - Keyboard shortcuts for common actions

- **Configuration**
  - Configurable Xcode path
  - Default scheme and device settings
  - Extension settings in VS Code preferences

- **Development Features**
  - Terminal integration for build commands
  - Error handling and user feedback
  - Debug logging support

### Technical Details
- Built with TypeScript and VS Code Extension API
- Uses `xcodebuild` and `xcrun` for Xcode integration
- Supports macOS with Xcode installation
- Webpack-based build system
- Comprehensive test suite

### Known Limitations
- Requires macOS with Xcode installed
- Only supports iOS simulators (physical device support planned)
- Limited to basic build and run operations (debugging support planned)