@echo off
echo ===================================================================
echo   SIH MINING - WEB APPLICATION & LOGIN DASHBOARD
echo   Smart India Hackathon (SIH) - Ministry of Coal
echo ===================================================================
echo.
echo Launching local server on http://localhost:8080 ...
echo.
start http://localhost:8080
python -m http.server 8080
pause
