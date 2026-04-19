#define MyAppName "NeuronGrid"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Nilabh"
#define MyAppURL "https://neurongrid.com"
#define MyAppExeName "NeuronGrid.exe"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=LICENSE.txt
OutputDir=dist
OutputBaseFilename=NeuronGrid-Setup-{#MyAppVersion}
SetupIconFile=assets\icon.ico
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode

[Files]
Source: "dist\NeuronGrid.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "cluster-core\*"; DestDir: "{app}\cluster-core"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "node-agent\*"; DestDir: "{app}\node-agent"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "web-ui\*"; DestDir: "{app}\web-ui"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "cli.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "PEER-MODE.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "Start_NeuronGrid.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "Start-Peer.bat"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
function InitializeSetup(): Boolean;
var
  ResultCode: Integer;
begin
  // Check if Python is installed
  if not RegKeyExists(HKEY_LOCAL_MACHINE, 'SOFTWARE\Python\PythonCore\3.9') and
     not RegKeyExists(HKEY_LOCAL_MACHINE, 'SOFTWARE\Python\PythonCore\3.10') and
     not RegKeyExists(HKEY_LOCAL_MACHINE, 'SOFTWARE\Python\PythonCore\3.11') and
     not RegKeyExists(HKEY_LOCAL_MACHINE, 'SOFTWARE\Python\PythonCore\3.12') and
     not RegKeyExists(HKEY_CURRENT_USER, 'SOFTWARE\Python\PythonCore\3.9') and
     not RegKeyExists(HKEY_CURRENT_USER, 'SOFTWARE\Python\PythonCore\3.10') and
     not RegKeyExists(HKEY_CURRENT_USER, 'SOFTWARE\Python\PythonCore\3.11') and
     not RegKeyExists(HKEY_CURRENT_USER, 'SOFTWARE\Python\PythonCore\3.12') then
  begin
    if MsgBox('Python 3.9+ is required but not found. Would you like to download it now?', mbConfirmation, MB_YESNO) = IDYES then
    begin
      ShellExec('open', 'https://www.python.org/downloads/', '', '', SW_SHOW, ewNoWait, ResultCode);
    end;
    Result := False;
  end
  else
    Result := True;
end;
