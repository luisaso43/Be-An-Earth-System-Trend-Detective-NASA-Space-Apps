@echo off
REM Double-click to start Earth Data Detective.
cd /d "%~dp0"
py -m pip install -r requirements.txt
py -m streamlit run app.py
pause
