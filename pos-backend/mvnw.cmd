@echo off
setlocal EnableExtensions EnableDelayedExpansion
set "MAVEN_PROJECTBASEDIR=%~dp0"
set "MAVEN_WRAPPER_PROPERTIES=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.properties"
for /f "usebackq tokens=1,* delims==" %%A in ("%MAVEN_WRAPPER_PROPERTIES%") do (
  if "%%A"=="distributionUrl" set "MAVEN_DISTRIBUTION_URL=%%B"
)
if not defined MAVEN_DISTRIBUTION_URL (
  echo Maven Wrapper configuration is missing distributionUrl. 1>&2
  exit /b 1
)
set "MAVEN_VERSION=3.9.9"
set "MAVEN_HOME=%USERPROFILE%\.m2\wrapper\dists\apache-maven-%MAVEN_VERSION%-bin"
set "MAVEN_DIST=%MAVEN_HOME%\apache-maven-%MAVEN_VERSION%"
set "MAVEN_BIN=%MAVEN_DIST%\bin\mvn.cmd"
if not exist "%MAVEN_BIN%" (
  set "MAVEN_ZIP=%TEMP%\apache-maven-%MAVEN_VERSION%-bin.zip"
  echo Downloading Apache Maven %MAVEN_VERSION%...
  where curl.exe >nul 2>nul
  if not errorlevel 1 (
    curl.exe --fail --location --silent --show-error --connect-timeout 10 --max-time 120 --output "!MAVEN_ZIP!" "%MAVEN_DISTRIBUTION_URL%"
  ) else (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '%MAVEN_DISTRIBUTION_URL%' -OutFile '!MAVEN_ZIP!' -TimeoutSec 120"
  )
  if errorlevel 1 exit /b 1
  if not exist "%MAVEN_HOME%" mkdir "%MAVEN_HOME%"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '!MAVEN_ZIP!' -DestinationPath '%MAVEN_HOME%' -Force"
  if errorlevel 1 exit /b 1
)
if not exist "%MAVEN_BIN%" (
  echo Unable to locate Maven executable at "%MAVEN_BIN%". 1>&2
  exit /b 1
)
call "%MAVEN_BIN%" %*
exit /b %ERRORLEVEL%
