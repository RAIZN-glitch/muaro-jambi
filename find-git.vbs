Dim oShell, oExec
Set oShell = CreateObject("WScript.Shell")

Dim logFile
logFile = "D:\ambatucode python\candi-project-a06e58d26d8d73ce3fd3b0bbea2d6cc06aee7e78\MuaroJambi_Web\find-git-log.txt"

' Run where git and capture output
Set oExec = oShell.Exec("where git")
Dim output
output = ""
Do While Not oExec.StdOut.AtEndOfStream
    output = output & oExec.StdOut.ReadLine() & vbCrLf
Loop

' Also get PATH
Dim pathVar
pathVar = oShell.ExpandEnvironmentStrings("%PATH%")

' Write to log
Dim fso, file
Set fso = CreateObject("Scripting.FileSystemObject")
Set file = fso.CreateTextFile(logFile, True)
file.WriteLine "=== WHERE GIT ==="
file.WriteLine output
file.WriteLine ""
file.WriteLine "=== PATH ==="
file.WriteLine pathVar
file.Close

MsgBox "Git search done! Check find-git-log.txt", 64, "Find Git"
