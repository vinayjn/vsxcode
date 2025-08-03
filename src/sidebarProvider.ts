import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Interfaces
interface XcodeProject {
    path: string;
    name: string;
    schemes: string[];
    devices: Device[];
}

interface Device {
    id: string;
    name: string;
    type: 'simulator' | 'device';
    os: string;
}

export class VSXcodeSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'vsxcode.sidebar';
    private _view?: vscode.WebviewView;

    private _state = {
        currentProject: null as XcodeProject | null,
        selectedScheme: '',
        selectedDevice: null as Device | null
    };

    constructor(private readonly _extensionUri: vscode.Uri) {
        console.log('[VSXcode] SidebarProvider constructor called');
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        console.log('[VSXcode] Resolving webview view');
        console.log('[VSXcode] Webview visible:', webviewView.visible);
        
        try {
            this._view = webviewView;

            webviewView.webview.options = {
                enableScripts: true,
                localResourceRoots: [this._extensionUri]
            };

            const html = this._getHtmlForWebview();
            console.log('[VSXcode] Setting webview HTML...');
            webviewView.webview.html = html;
            console.log('[VSXcode] Webview HTML set successfully');

            // Initialize webview message handling
            this.initializeWebviewMessageHandling(webviewView);
            
            // Trigger initial refresh
            this.refresh();
        } catch (error) {
            console.error('[VSXcode] Error setting up webview:', error);
        }

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview();
        console.log('[VSXcode] Webview HTML content set');
        
        // Log when messages are received from the webview
        webviewView.webview.onDidReceiveMessage(message => {
            console.log('[VSXcode] Received message from webview:', message);
        });

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'runApp': this.runApp(); break;
                case 'buildApp': this.buildApp(); break;
                case 'cleanBuild': this.cleanBuild(); break;
                case 'selectScheme': this.selectScheme(); break;
                case 'selectDevice': this.selectDevice(); break;
                case 'refresh': this.refresh(); break;
            }
        });

        webviewView.onDidChangeVisibility(() => {
            if (this._view?.visible) {
                this.refresh();
            }
        });

        // Initial refresh
        this.refresh();
    }

    public refresh() {
        this.updateProjectState();
    }

    private async updateProjectState() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        console.log('[VSXcode] Workspace folder:', workspaceFolder?.uri.fsPath);
        if (!workspaceFolder) {
            console.log('[VSXcode] No workspace folder found');
            this._state.currentProject = null;
            this.updateWebview();
            return;
        }

        const projectPath = await this.findXcodeProject(workspaceFolder.uri.fsPath);
        console.log('[VSXcode] Found Xcode project at:', projectPath);
        if (projectPath) {
            try {
                this._state.currentProject = await this.getProjectInfo(projectPath);
                console.log('[VSXcode] Project info loaded:', this._state.currentProject);
            } catch (error) {
                console.error('[VSXcode] Error loading project info:', error);
                this._state.currentProject = null;
            }
        }
        else {
            console.log('[VSXcode] No Xcode project found in workspace');
            this._state.currentProject = null;
        }
        this.updateWebview();
    }

    private async findXcodeProject(rootPath: string): Promise<string | null> {
        try {
            console.log('[VSXcode] Searching for Xcode project in:', rootPath);
            const { stdout, stderr } = await execAsync(`find "${rootPath}" -maxdepth 1 -name "*.xcodeproj" -o -name "*.xcworkspace" -type d -not -path "*/.build/*" 2>/dev/null | head -1`);
            if (stderr) {
                console.error('[VSXcode] Error in find command:', stderr);
            }
            const result = stdout.trim() || null;
            console.log('[VSXcode] Find command result:', result);
            return result;
        } catch (error) {
            console.error('[VSXcode] Error finding Xcode project:', error);
            return null;
        }
    }

    private async getProjectInfo(projectPath: string): Promise<XcodeProject> {
        const projectName = projectPath.split('/').pop()?.replace(/\.(xcodeproj|xcworkspace)$/, '') || '';
        const schemes = await this.getSchemes(projectPath);
        const devices = await this.getDevices();
        return { path: projectPath, name: projectName, schemes, devices };
    }

    private async getSchemes(projectPath: string): Promise<string[]> {
        try {
            console.log('[VSXcode] Getting schemes for project:', projectPath);
            const { stdout, stderr } = await execAsync(`xcodebuild -list -project "${projectPath}" 2>/dev/null || xcodebuild -list -workspace "${projectPath}" 2>/dev/null`);
            if (stderr) {
                console.error('[VSXcode] Error in xcodebuild list command:', stderr);
            }
            const lines = stdout.split('\n');
            let inSchemes = false;
            const schemes: string[] = [];
            for (const line of lines) {
                if (line.includes('Schemes:')) { inSchemes = true; continue; }
                if (inSchemes && line.trim() && !line.includes('User') && !line.includes('Shared')) { schemes.push(line.trim()); }
                if (inSchemes && line.trim() === '') break;
            }
            console.log('[VSXcode] Found schemes:', schemes);
            return schemes;
        } catch (error) {
            console.error('[VSXcode] Error getting schemes:', error);
            return [];
        }
    }

    private async getDevices(): Promise<Device[]> {
        try {
            const { stdout } = await execAsync('xcrun simctl list devices available --json');
            const devicesOutput = JSON.parse(stdout);
            const devices: Device[] = [];
            for (const osKey in devicesOutput.devices) {
                if (osKey.startsWith('com.apple.CoreSimulator.SimRuntime.iOS')) {
                    for (const device of devicesOutput.devices[osKey]) {
                        if (device.isAvailable) {
                            devices.push({
                                id: device.udid,
                                name: device.name,
                                type: 'simulator',
                                os: osKey.replace('com.apple.CoreSimulator.SimRuntime.', '')
                            });
                        }
                    }
                }
            }
            return devices;
        } catch (error) {
            console.error('[VSXcode] Error getting devices:', error);
            return [];
        }
    }

    private async runApp() {
        if (!this._state.currentProject) { vscode.window.showErrorMessage('No Xcode project found.'); return; }
        const scheme = this._state.selectedScheme || await this.selectSchemeInternal();
        if (!scheme) { return; }
        const device = this._state.selectedDevice || await this.selectDeviceInternal();
        if (!device) { return; }

        vscode.window.showInformationMessage(`Running ${this._state.currentProject.name} on ${device.name}`);
        // Build for running on simulator
        const buildCommand = `xcodebuild -project "${this._state.currentProject.path}" -scheme "${scheme}" -destination "platform=iOS Simulator,id=${device.id}" -configuration Debug build`;
        // Open simulator and install/launch app
        const openSimulator = `xcrun simctl boot ${device.id} && open -a Simulator`;
        const appPath = `$(find ~/Library/Developer/Xcode/DerivedData/${this._state.currentProject.name}-*/Build/Products/Debug-iphonesimulator -name "*.app" -type d)`;
        const installCommand = `xcrun simctl install ${device.id} ${appPath}`;
        const launchCommand = `xcrun simctl launch ${device.id} $(defaults read ${appPath}/Info.plist CFBundleIdentifier)`;
        
        const terminal = vscode.window.createTerminal('VSXcode');
        terminal.show();
        terminal.sendText(openSimulator);
        terminal.sendText(buildCommand);
        // Wait for build to complete then install and launch
        terminal.sendText(`if [ $? -eq 0 ]; then ${installCommand} && ${launchCommand}; fi`);
    }

    private async buildApp() {
        if (!this._state.currentProject) { vscode.window.showErrorMessage('No Xcode project found.'); return; }
        const scheme = this._state.selectedScheme || await this.selectSchemeInternal();
        if (!scheme) { return; }

        vscode.window.showInformationMessage(`Building ${this._state.currentProject.name}`);
        const command = `xcodebuild -project "${this._state.currentProject.path}" -scheme "${scheme}" build`;
        const terminal = vscode.window.createTerminal('VSXcode');
        terminal.show();
        terminal.sendText(command);
    }

    private async cleanBuild() {
        if (!this._state.currentProject) { vscode.window.showErrorMessage('No Xcode project found.'); return; }
        const scheme = this._state.selectedScheme || await this.selectSchemeInternal();
        if (!scheme) { return; }

        vscode.window.showInformationMessage(`Cleaning ${this._state.currentProject.name}`);
        const command = `xcodebuild -project "${this._state.currentProject.path}" -scheme "${scheme}" clean build`;
        const terminal = vscode.window.createTerminal('VSXcode');
        terminal.show();
        terminal.sendText(command);
    }

    private async selectScheme() {
        if (!this._state.currentProject) { vscode.window.showErrorMessage('No Xcode project found.'); return; }
        const scheme = await this.selectSchemeInternal();
        if (scheme) {
            this._state.selectedScheme = scheme;
            this.updateWebview();
        }
    }

    private async selectDevice() {
        if (!this._state.currentProject) { vscode.window.showErrorMessage('No Xcode project found.'); return; }
        const device = await this.selectDeviceInternal();
        if (device) {
            this._state.selectedDevice = device;
            this.updateWebview();
        }
    }

    private async selectSchemeInternal(): Promise<string | undefined> {
        if (!this._state.currentProject?.schemes.length) {
            vscode.window.showErrorMessage('No schemes found.');
            return undefined;
        }
        return vscode.window.showQuickPick(this._state.currentProject.schemes, { placeHolder: 'Select a scheme' });
    }

    private async selectDeviceInternal(): Promise<Device | undefined> {
        if (!this._state.currentProject?.devices.length) {
            vscode.window.showErrorMessage('No devices found.');
            return undefined;
        }
        const deviceNames = this._state.currentProject.devices.map(d => `${d.name} (${d.os})`);
        const selectedName = await vscode.window.showQuickPick(deviceNames, { placeHolder: 'Select a device' });
        return this._state.currentProject.devices.find(d => `${d.name} (${d.os})` === selectedName);
    }

    private updateWebview() {
        if (this._view) {
            const message = {
                type: 'updateContent',
                projectInfo: this._state.currentProject ? {
                    name: this._state.currentProject.name,
                    selectedScheme: this._state.selectedScheme,
                    selectedDevice: this._state.selectedDevice,
                    schemes: this._state.currentProject.schemes,
                    devices: this._state.currentProject.devices
                } : null
            };
            console.log('[VSXcode] Sending message to webview:', message);
            this._view.webview.postMessage(message);
        } else {
            console.log('[VSXcode] No webview available to update');
        }
    }

    private initializeWebviewMessageHandling(webviewView: vscode.WebviewView) {
        webviewView.webview.onDidReceiveMessage(message => {
            console.log('[VSXcode] Received message from webview:', message);
            switch (message.type) {
                case 'refresh':
                    console.log('[VSXcode] Refresh requested from webview');
                    this.refresh();
                    break;
            }
        });
    }

    private _getHtmlForWebview(): string {
        console.log('[VSXcode] Generating HTML for webview');
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VSXcode</title>
    <style>
        body { 
            font-family: var(--vscode-font-family, sans-serif); 
            margin: 0; 
            padding: 1em;
            color: var(--vscode-foreground);
        }
        .section { 
            margin-bottom: 1em;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .label { 
            font-weight: bold;
            min-width: 60px;
        }
        .value { 
            color: var(--vscode-descriptionForeground);
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 2px;
            cursor: pointer;
            margin: 0;
            min-width: 120px;
            text-align: left;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        button.inline-button {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            flex: 1;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        button.inline-button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 16px;
            border-top: 1px solid var(--vscode-panel-border);
            padding-top: 16px;
        }
        .action-group {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
    </style>
</head>
<body>
    <h2>VSXcode Project Info</h2>
    <div id="project-info">
        <span class="empty">Loading project info...</span>
    </div>
    <div class="actions">
        <div class="action-group">
            <button onclick="runApp()" id="runButton">Run App</button>
            <button onclick="buildApp()" id="buildButton">Build App</button>
            <button onclick="cleanBuild()" id="cleanButton">Clean Build</button>
        </div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        function renderProjectInfo(project) {
            if (!project) {
                document.getElementById('project-info').innerHTML = '<span class="empty">No Xcode project found in this workspace.</span>';
                return;
            }
            let html = '';
            html += '<div class="section"><span class="label">Project:</span><span class="value">' + project.name + '</span></div>';
            html += '<div class="section">';
            html += '<span class="label">Scheme:</span>';
            html += '<button onclick="selectScheme()" id="schemeButton" class="inline-button">' + 
                (project.selectedScheme || 'Select Scheme') + '</button>';
            html += '</div>';
            html += '<div class="section">';
            html += '<span class="label">Device:</span>';
            html += '<button onclick="selectDevice()" id="deviceButton" class="inline-button">' + 
                (project.selectedDevice ? project.selectedDevice.name : 'Select Device') + '</button>';
            html += '</div>';
            document.getElementById('project-info').innerHTML = html;
            
            // Update button states based on project info
            const hasProject = project !== null;
            const hasScheme = hasProject && project.selectedScheme;
            const hasDevice = hasProject && project.selectedDevice;
            
            document.getElementById('schemeButton').disabled = !hasProject;
            document.getElementById('deviceButton').disabled = !hasProject;
            document.getElementById('runButton').disabled = !hasProject || !hasScheme || !hasDevice;
            document.getElementById('buildButton').disabled = !hasProject || !hasScheme;
            document.getElementById('cleanButton').disabled = !hasProject || !hasScheme;
        }
        
        // Action handlers
        function selectScheme() {
            vscode.postMessage({ type: 'selectScheme' });
        }
        
        function selectDevice() {
            vscode.postMessage({ type: 'selectDevice' });
        }
        
        function runApp() {
            vscode.postMessage({ type: 'runApp' });
        }
        
        function buildApp() {
            vscode.postMessage({ type: 'buildApp' });
        }
        
        function cleanBuild() {
            vscode.postMessage({ type: 'cleanBuild' });
        }

        window.addEventListener('message', function(event) {
            var message = event.data;
            if (message.type === 'updateContent') {
                renderProjectInfo(message.projectInfo);
            }
        });
        
        // Request initial refresh
        vscode.postMessage({ type: 'refresh' });
    </script>
</body>
</html>`;
    }
}
