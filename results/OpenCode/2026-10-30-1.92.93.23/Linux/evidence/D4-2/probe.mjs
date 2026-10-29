// probe for D4-2 - executed 20261030051443
// env print classify => [{"c":"env | grep HW_ACCESS_KEY","d":"deny","risk":"credential"},{"c":"printenv HW_SECRET_KEY","d":"deny","risk":"credential"},{"c":"env | grep -i access_key","d":"allow","risk":"not_huaweicloud"},{"c":"env | grep HUAWEICLOUD_SDK_AK","d":"deny","risk":"credential"},{"c":"env | grep HCLOUD_AK","d":"deny","risk":"credential"}]
