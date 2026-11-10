@echo off
REM D1-3 缺失场景注入：venv（无 mcp）置于 PATH 首位
set PATH=C:\Users\Administrator\AppData\Local\Programs\OfficeAce\tools\node;C:\Users\Administrator\devkit-test\OfficeAce\_tmp_venv_d13\Scripts;%PATH%
echo === python resolved ===
where python
python -c "import mcp" 2>&1
echo rc_import_mcp=%ERRORLEVEL%
echo === doctor with missing mcp ===
call huaweicloud-devkit doctor 2>&1
echo doctor_rc=%ERRORLEVEL%
