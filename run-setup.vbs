Dim oShell
Set oShell = CreateObject("WScript.Shell")

Dim proj
proj = "D:\ambatucode python\candi-project-a06e58d26d8d73ce3fd3b0bbea2d6cc06aee7e78\MuaroJambi_Web"

' Kill any stuck wscript processes (except this one) - ignore errors
On Error Resume Next
oShell.Run "taskkill /F /IM powershell.exe /FI ""WINDOWTITLE eq Windows PowerShell""", 0, False
On Error GoTo 0

Dim psScript
psScript = proj & "\setup-github.ps1"

Dim cmd
cmd = "powershell.exe -ExecutionPolicy Bypass -File """ & psScript & """"

' Show window (1), don't wait (False) - so it runs and we watch via log
oShell.Run cmd, 1, False
