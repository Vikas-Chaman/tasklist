@echo off
REM Batch file to start a Python HTTP server and open index.html

REM --- Configuration ---
set "TARGET_DIR=C:\DAILY"
set "HTML_FILE=index.html"
set "PORT=3000"

set "PYTHON_EXE=python"
REM The line above sets the Python executable command.
REM - If 'python' doesn't work for you but 'py' does (Python Launcher on Windows), change it to: set "PYTHON_EXE=py"
REM - If Python is not in your system PATH, you'll need to use the full path, e.g.:
REM   set "PYTHON_EXE=C:\Users\YourUser\AppData\Local\Programs\Python\Python39\python.exe"
REM   (Adjust the path to where your python.exe is located)

REM --- Check if Python is available ---
echo Testing Python command: %PYTHON_EXE% --version
%PYTHON_EXE% --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: The command '%PYTHON_EXE%' was not found or Python is not installed correctly for this command.
    echo Please ensure Python is installed and the command '%PYTHON_EXE%' is recognized in your system PATH,
    echo or update the PYTHON_EXE variable in this script with the correct command or full path.
    pause
    exit /b 1
)
echo Python command '%PYTHON_EXE%' found.

echo.
echo Navigating to directory: %TARGET_DIR%
cd /d "%TARGET_DIR%"
if errorlevel 1 (
    echo ERROR: Could not navigate to directory %TARGET_DIR%.
    pause
    exit /b 1
)
echo Current directory: %cd%

echo.
echo Starting Python HTTP server on port %PORT%...
REM For Python 3.x:
start "PythonServer-%PORT%" %PYTHON_EXE% -m http.server %PORT%
REM For Python 2.x (if you use Python 2, comment the line above and uncomment the line below):
REM start "PythonServer-%PORT%" %PYTHON_EXE% -m SimpleHTTPServer %PORT%

echo.
echo Waiting 3 seconds for the server to initialize...
timeout /t 3 /nobreak >nul

echo.
echo Opening http://localhost:%PORT%/%HTML_FILE% in your default browser...
start http://localhost:%PORT%/%HTML_FILE%

echo.
echo Server should be running in a separate window named "PythonServer-%PORT%".
echo To stop the server, close that command prompt window.
echo.

REM Optional: pause to keep this window open until a key is pressed
REM pause