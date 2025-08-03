// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { VSXcodeSidebarProvider } from './sidebarProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('[VSXcode] Extension is now active!');

    // Create and register the sidebar provider
    const sidebarProvider = new VSXcodeSidebarProvider(context.extensionUri);
    
    // Register the webview view provider
    const providerRegistration = vscode.window.registerWebviewViewProvider(
        VSXcodeSidebarProvider.viewType,
        sidebarProvider,
        {
            webviewOptions: {
                retainContextWhenHidden: true
            }
        }
    );
    
    context.subscriptions.push(providerRegistration);
    console.log('[VSXcode] SidebarProvider registered');
    
    // Register the focus command
    context.subscriptions.push(
        vscode.commands.registerCommand('vsxcode.sidebar.focus', () => {
            vscode.commands.executeCommand('workbench.view.extension.vsxcode-sidebar');
        })
    );

    // Register a command to refresh the sidebar
    context.subscriptions.push(
        vscode.commands.registerCommand('vsxcode.refreshSidebar', () => {
            sidebarProvider.refresh();
        })
    );

    // Explicitly open the sidebar view on activation
    vscode.commands.executeCommand('workbench.view.extension.vsxcode');
}

export function deactivate() {}
