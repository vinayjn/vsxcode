# VSXcode - iOS/macOS Development in VS Code

VSXcode is a VS Code extension that brings Xcode-like functionality directly into VS Code, allowing you to build and run iOS/macOS applications without leaving your editor.

## Features

### 🚀 Core Functionality
- **Run App** (`Cmd+R`) - Build and run your iOS/macOS app on simulator or device
- **Build App** (`Cmd+B`) - Build your app without running it
- **Clean Build** - Clean and rebuild your project
- **Scheme Selection** - Choose which build scheme to use
- **Device Selection** - Select target device or simulator

### 🎯 Key Features
- **Sidebar Panel** - Dedicated VSXcode panel with buttons for all actions
- **Xcode Project Detection** - Automatically detects `.xcodeproj` and `.xcworkspace` files
- **Status Bar Integration** - Shows current project and quick access to commands
- **Keyboard Shortcuts** - Familiar shortcuts like `Cmd+R` for running apps
- **Device Management** - Lists available iOS simulators and devices
- **Scheme Management** - Automatically discovers project schemes

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press `F5` in VS Code to launch the extension in debug mode

## Usage

### Prerequisites
- macOS with Xcode installed
- iOS/macOS project with `.xcodeproj` or `.xcworkspace` file
- VS Code workspace containing your Xcode project

### Basic Workflow

1. **Open your Xcode project** in VS Code
2. **Click the VSXcode icon** in the activity bar (sidebar) to open the VSXcode panel
3. **Select a scheme** by clicking "Select Scheme" button or using `Cmd+Shift+P` → "VSXcode: Select Scheme"
4. **Select a device** by clicking "Select Device" button or using `Cmd+Shift+P` → "VSXcode: Select Device"
5. **Run your app** by clicking "Run App" button or using `Cmd+R`

### Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `VSXcode: Run App` | `Cmd+R` | Build and run the app |
| `VSXcode: Build App` | `Cmd+B` | Build the app without running |
| `VSXcode: Clean Build` | - | Clean and rebuild the project |
| `VSXcode: Select Scheme` | - | Choose build scheme |
| `VSXcode: Select Device` | - | Choose target device/simulator |
| `VSXcode: Show Status` | - | Display current project status |

### Configuration

The extension can be configured through VS Code settings:

```json
{
  "vsxcode.xcodePath": "/Applications/Xcode.app/Contents/Developer",
  "vsxcode.defaultScheme": "YourApp",
  "vsxcode.defaultDevice": "iPhone 15 Pro"
}
```

## Sidebar Panel

The extension adds a dedicated VSXcode panel in the sidebar that provides:

### 🎯 Visual Interface
- **Project Information** - Shows current project name, selected scheme, and device
- **Action Buttons** - Clickable buttons for all major actions:
  - **Run App** - Build and run your app (primary action)
  - **Build App** - Build without running
  - **Select Scheme** - Choose build scheme
  - **Select Device** - Choose target device/simulator
  - **Clean Build** - Clean and rebuild project
- **Refresh Button** - Update project information
- **Real-time Updates** - Panel updates when you change schemes or devices

### 🎨 Design Features
- **VS Code Theme Integration** - Automatically adapts to your VS Code theme
- **Responsive Layout** - Works well in different panel sizes
- **Visual Feedback** - Buttons provide hover and click feedback
- **Loading States** - Shows loading spinner while detecting projects

## Status Bar

The extension also adds a status bar item that shows:
- Current project name (when in an Xcode project)
- Quick access to show project status
- Visual indicator when extension is active

## Development

### Project Structure
```
src/
├── extension.ts          # Main extension logic
└── test/
    └── extension.test.ts # Unit tests
```

### Building
```bash
npm run compile          # Build extension
npm run watch           # Watch for changes
npm run package         # Create VSIX package
```

### Testing
```bash
npm run test            # Run unit tests
npm run lint            # Run linter
```

## Troubleshooting

### Common Issues

1. **"No Xcode project found"**
   - Ensure your workspace contains a `.xcodeproj` or `.xcworkspace` file
   - Make sure the project file is in the root of your workspace

2. **"No schemes found"**
   - Verify your Xcode project has build schemes configured
   - Try opening the project in Xcode first to ensure schemes are properly set up

3. **"No devices found"**
   - Ensure Xcode is properly installed
   - Run `xcrun simctl list devices` in terminal to verify simulators are available

4. **Build failures**
   - Check that all dependencies are properly configured in your Xcode project
   - Verify the selected scheme is valid for your project

### Debug Mode

To enable debug logging:
1. Open VS Code Developer Tools (`Help` → `Toggle Developer Tools`)
2. Look for console messages from the VSXcode extension

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Roadmap

- [ ] Support for physical device deployment
- [ ] Build configuration selection
- [ ] Test running integration
- [ ] Debugging support
- [ ] Project templates
- [ ] Swift Package Manager integration
- [ ] CocoaPods/Carthage support
