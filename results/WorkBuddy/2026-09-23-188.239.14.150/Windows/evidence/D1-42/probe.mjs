// D1-42 - real daily probe (fixup pass)
// dismiss:true 后 dismissed=false；再次调用 dismissed=false。因 targetVersion 恒为 null（parse 层失效），dismiss 无法记录冷却 → 闭环不成立
