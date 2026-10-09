@echo off
cd /d "%~dp0"
echo Visit http://localhost:4173/ after the server starts.
py -m http.server 4173 || python -m http.server 4173
pause
