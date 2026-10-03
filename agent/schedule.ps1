# Register a Windows Task Scheduler job that runs your agent duties automatically.
#   powershell -ExecutionPolicy Bypass -File agent\schedule.ps1                       # nightly at 02:00, local branches only
#   powershell -ExecutionPolicy Bypass -File agent\schedule.ps1 -Time 01:30 -Push     # also push branches to GitHub
#   powershell -ExecutionPolicy Bypass -File agent\schedule.ps1 -Schedule weekly      # weekly (Sundays)
#   powershell -ExecutionPolicy Bypass -File agent\schedule.ps1 -Remove               # delete the job
param(
  [ValidateSet("nightly","weekly")][string]$Schedule = "nightly",
  [string]$Time = "02:00",
  [switch]$Push,
  [switch]$Remove
)
$root = Split-Path -Parent $PSScriptRoot
$name = "Ten4Text-Agent-$Schedule"

if ($Remove) {
  Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Removed task $name"
  return
}

$node = (Get-Command node -ErrorAction Stop).Source
$argLine = "agent\run.mjs --schedule $Schedule"
if ($Push) { $argLine += " --push" }

$action   = New-ScheduledTaskAction -Execute $node -Argument $argLine -WorkingDirectory $root
$trigger  = if ($Schedule -eq "weekly") { New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At $Time } else { New-ScheduledTaskTrigger -Daily -At $Time }
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Settings $settings `
  -Description "Ten4 Text agent: runs '$Schedule' duties on gated branches" -Force | Out-Null

Write-Host "Scheduled '$name' ($Schedule at $Time). Your PC must be on and you must be logged in."
Write-Host "Missed runs start as soon as the PC is available. Test it now with:  Start-ScheduledTask -TaskName $name"
