@echo off
set PATH=C:\Users\Administrator\AppData\Local\Programs\OfficeAce\tools\node;%PATH%
echo === huaweicloud-devkit --help ===
call huaweicloud-devkit --help 2>&1
echo help_rc=%ERRORLEVEL%
echo === update --help ===
call huaweicloud-devkit update --help 2>&1
echo update_help_rc=%ERRORLEVEL%
echo === check-update ===
call huaweicloud-devkit check-update 2>&1
echo checkupdate_rc=%ERRORLEVEL%
