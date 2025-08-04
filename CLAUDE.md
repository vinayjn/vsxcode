# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VSXcode is a VS Code extension that brings Xcode functionality directly into VS Code, allowing iOS/macOS development without leaving the editor. The extension provides a sidebar interface for running Xcode commands like build, run, clean, and device/scheme selection.

## Architecture

### Core Components
- **extension.ts** - Main extension entry point, registers commands and sidebar provider
- **sidebarProvider.ts** - WebView-based sidebar implementation with Xcode integration logic
- **sidebar.html** (embedded) - HTML interface rendered in the sidebar WebView

### Key Design Patterns
- Uses VS Code WebView API for rich sidebar interface with bidirectional messaging
- Executes Xcode commands via child_process.exec() with xcodebuild and xcrun simctl
- State management through internal `_state` object tracking current project, scheme, and device
- Async/await pattern for all Xcode command execution

### Xcode Integration
- Project discovery via `find` command searching for .xcodeproj/.xcworkspace files
- Scheme detection via `xcodebuild -list` parsing
- Device/simulator enumeration via `xcrun simctl list devices --json`
- Terminal integration for command execution visibility

## Development Commands

### Build & Package
```bash
npm run compile          # Compile TypeScript to JavaScript
npm run watch           # Watch mode for development
npm run package         # Create production VSIX package
npm run vscode:prepublish # Prepublish script (runs package)
```

### Testing & Quality
```bash
npm run test            # Run unit tests with vscode-test
npm run lint            # Run ESLint on src/
npm run pretest         # Compile tests + compile + lint (runs before test)
npm run compile-tests   # Compile test files to out/
npm run watch-tests     # Watch mode for test compilation
```

### Extension Development
- Press F5 in VS Code to launch Extension Development Host
- The extension activates when the VSXcode sidebar view is opened
- Use Debug Console to view extension logs (search for `[VSXcode]`)

## Configuration

The extension reads VS Code settings:
- `vsxcode.xcodePath` - Path to Xcode developer directory (default: /Applications/Xcode.app/Contents/Developer)
- `vsxcode.defaultScheme` - Default build scheme
- `vsxcode.defaultDevice` - Default target device

## Key Commands & Shortcuts
- `Cmd+R` - Run App (vsxcode.runApp)
- `Cmd+B` - Build App (vsxcode.buildApp)
- Available via Command Palette and right-click context menus

## Technical Notes

### WebView Communication
The sidebar uses VS Code's WebView API with message passing:
- Extension → WebView: `postMessage()` with state updates
- WebView → Extension: `onDidReceiveMessage()` for user actions

### State Management
Extension maintains project state including:
- Current Xcode project path and metadata
- Available schemes and devices
- User selections for scheme/device

### Error Handling
- Graceful degradation when no Xcode project found
- Console logging with `[VSXcode]` prefix for debugging
- User-facing error messages via `vscode.window.showErrorMessage()`

### Dependencies
- Uses Node.js child_process for Xcode command execution
- Webpack bundling for distribution
- TypeScript with strict type checking enabled

## CI/CD & Release Process

### GitHub Actions Workflow
The project includes automated CI/CD via `.github/workflows/release.yml`:

**On Pull Requests & Manual Triggers:**
- Installs dependencies and runs linter
- Executes unit tests with xvfb for headless VS Code testing
- Builds extension in production mode
- Packages extension as .vsix artifact

**On Tag Creation (v*):**
- Performs full build and test suite
- Creates production .vsix package
- Automatically creates GitHub Release with:
  - Generated release notes
  - Downloadable .vsix file
  - Installation instructions

### Creating a Release
1. Update version in `package.json`
2. Commit changes: `git commit -am "Release vX.X.X"`
3. Create and push tag: `git tag vX.X.X && git push origin vX.X.X`
4. GitHub Actions will automatically build and release

### Manual Build Commands
```bash
npm install -g @vscode/vsce    # Install VS Code extension packager
vsce package                   # Create .vsix file locally
```