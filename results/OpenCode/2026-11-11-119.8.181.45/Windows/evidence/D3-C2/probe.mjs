// real write attempt with readonly subaccount -> denied by IAM policy
// hcloud VPC CreateVpc --vpc.name=hdk-denied-probe --vpc.cidr=192.168.99.0/24
console.log('PolicyNotAuthorized');
