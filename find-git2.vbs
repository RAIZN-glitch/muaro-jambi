Dim oShell, oReg, oFSO, oFile
Set oShell = CreateObject("WScript.Shell")
Set oFSO = CreateObject("Scripting.FileSystemObject")

Dim logFile
logFile = "D:\ambatucode python\candi-project-a06e58d26d8d73ce3fd3b0bbea2d6cc06aee7e78\MuaroJambi_Web\find-git2-log.txt"
Set oFile = oFSO.CreateTextFile(logFile, True)

' Try to read git path from Windows Registry
On Error Resume Next
Dim gitPath
gitPath = oShell.RegRead("HKLM\SOFTWARE\GitForWindows\InstallPath")
oFile.WriteLine "Git registry (HKLM): " & gitPath

gitPath = oShell.RegRead("HKCU\SOFTWARE\GitForWindows\InstallPath")
oFile.WriteLine "Git registry (HKCU): " & gitPath

' Also try common paths
Dim paths(10)
paths(0) = "C:\Program Files\Git\cmd\git.exe"
paths(1) = "C:\Program Files\Git\bin\git.exe"
paths(2) = "C:\Program Files (x86)\Git\cmd\git.exe"
paths(3) = "D:\Git\cmd\git.exe"
paths(4) = "D:\Git\bin\git.exe"
paths(5) = "C:\Users\Acer\scoop\apps\git\current\cmd\git.exe"
paths(6) = "C:\Users\Acer\scoop\apps\git\current\bin\git.exe"
paths(7) = "C:\tools\git\cmd\git.exe"
paths(8) = "D:\Program Files\Git\cmd\git.exe"
paths(9) = "D:\Program Files\Git\bin\git.exe"
paths(10) = "C:\ProgramData\chocolatey\bin\git.exe"
On Error GoTo 0

Dim i
For i = 0 To 10
    If oFSO.FileExists(paths(i)) Then
        oFile.WriteLine "FOUND: " & paths(i)
    End If
Next

' Run where.exe with /R to search recursively in common locations
Set oExec = oShell.Exec("where /R C:\Program Files git.exe")
Dim output
output = ""
Do While Not oExec.StdOut.AtEndOfStream
    output = output & oExec.StdOut.ReadLine() & vbCrLf
Loop
oFile.WriteLine "where /R C:\Program Files git.exe:"
oFile.WriteLine output

oFile.Close
MsgBox "Done! Check find-git2-log.txt", 64, "Find Git 2"
