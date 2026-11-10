@echo off
set PATH=C:\Users\Administrator\AppData\Local\Programs\OfficeAce\tools\node;C:\Users\Administrator\devkit-test\OfficeAce\_tmp_venv_d13\Scripts;%PATH%
echo === install auto-fix ===
call huaweicloud-devkit install 2>&1
echo install_rc=%ERRORLEVEL%
echo === doctor after fix ===
call huaweicloud-devkit doctor 2>&1
echo doctor_rc=%ERRORLEVEL%
echo === venv mcp check ===
python -c "import mcp,sys;print('mcp-ok',sys.executable)" 2>&1
