@REM Maven wrapper batch script
@echo off
where mvn >nul 2>&1
if %ERRORLEVEL% equ 0 (
  mvn %*
) else (
  "C:\Users\keduy\.m2\wrapper\dists\apache-maven-3.9.16-bin\5grr65jo27hi51sujmtcldfovl\apache-maven-3.9.16\bin\mvn.cmd" %*
)
