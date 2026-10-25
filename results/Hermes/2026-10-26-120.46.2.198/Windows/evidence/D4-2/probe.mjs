// D4-2: 凭证env打印拦截
// printenv HW_ACCESS_KEY => expect deny
// echo $HW_SECRET_KEY => expect deny
// printenv | grep -i HUAWEICLOUD => expect deny
// echo $HUAWEICLOUD_ACCESS_KEY => expect deny
// printenv HW_SECURITY_TOKEN => expect deny