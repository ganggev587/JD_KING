/*
京喜农场助力码
此助力码要求种子 active 相同才能助力，多个账号的话可以种植同样的种子，如果种子不同的话，会自动跳过使用云端助力
此文件为Node.js专用。其他用户请忽略
支持京东N个账号
 */
//云服务器腾讯云函数等NOde.js用户在此处填写京京喜农场的好友码。
// 同一个京东账号的好友助力码用@符号隔开,不同京东账号之间用&符号或者换行隔开,下面给一个示例
// 如: 京东账号1的shareCode1@京东账号1的shareCode2&京东账号2的shareCode1@京东账号2的shareCode2
let JxncShareCodes = [
  '{"smp":"58cfdd77d4ff2ed345f9e5aedb8de224","active":"jdnc_1_shanyaopian210601_2","joinnum":"2"}@{"smp":"d9da0248a3404803a2fd8174f3a20229","active":"jdnc_1_5yuanluosifen210305_2","joinnum":"1"}@{"smp":"e198a39894e21f65126eb8363f493630","active":"jdnc_1_dami210601_2","joinnum":"1"}@{"smp":"10c6ae43a3cf7ec7e283291092d627a6","active":"jdnc_1_3yuanganju210601_2","joinnum":"1"}@{"smp":"247c7f3bc6ffe8cff8208f834b4ca580","active":"jdnc_1_shanyaopian210601_2","joinnum":"1"}@{"smp":"dfa0c7820ba8dce0335a3399260f582b","active":"jdnc_1_xiacheng210315_2","joinnum":"2"}',//账号一的好友shareCode,不同好友中间用@符号隔开
  '{"smp":"58cfdd77d4ff2ed345f9e5aedb8de224","active":"jdnc_1_shanyaopian210601_2","joinnum":"2"}@{"smp":"d9da0248a3404803a2fd8174f3a20229","active":"jdnc_1_5yuanluosifen210305_2","joinnum":"1"}@{"smp":"e198a39894e21f65126eb8363f493630","active":"jdnc_1_dami210601_2","joinnum":"1"}@{"smp":"10c6ae43a3cf7ec7e283291092d627a6","active":"jdnc_1_3yuanganju210601_2","joinnum":"1"}@{"smp":"247c7f3bc6ffe8cff8208f834b4ca580","active":"jdnc_1_shanyaopian210601_2","joinnum":"1"}@{"smp":"dfa0c7820ba8dce0335a3399260f582b","active":"jdnc_1_xiacheng210315_2","joinnum":"2"}',//账号二的好友shareCode，不同好友中间用@符号隔开
  '{"smp":"58cfdd77d4ff2ed345f9e5aedb8de224","active":"jdnc_1_shanyaopian210601_2","joinnum":"2"}@{"smp":"d9da0248a3404803a2fd8174f3a20229","active":"jdnc_1_5yuanluosifen210305_2","joinnum":"1"}@{"smp":"e198a39894e21f65126eb8363f493630","active":"jdnc_1_dami210601_2","joinnum":"1"}@{"smp":"10c6ae43a3cf7ec7e283291092d627a6","active":"jdnc_1_3yuanganju210601_2","joinnum":"1"}@{"smp":"247c7f3bc6ffe8cff8208f834b4ca580","active":"jdnc_1_shanyaopian210601_2","joinnum":"1"}@{"smp":"dfa0c7820ba8dce0335a3399260f582b","active":"jdnc_1_xiacheng210315_2","joinnum":"2"}',
  '{"smp":"58cfdd77d4ff2ed345f9e5aedb8de224","active":"jdnc_1_shanyaopian210601_2","joinnum":"2"}@{"smp":"d9da0248a3404803a2fd8174f3a20229","active":"jdnc_1_5yuanluosifen210305_2","joinnum":"1"}@{"smp":"e198a39894e21f65126eb8363f493630","active":"jdnc_1_dami210601_2","joinnum":"1"}@{"smp":"10c6ae43a3cf7ec7e283291092d627a6","active":"jdnc_1_3yuanganju210601_2","joinnum":"1"}@{"smp":"247c7f3bc6ffe8cff8208f834b4ca580","active":"jdnc_1_shanyaopian210601_2","joinnum":"1"}@{"smp":"dfa0c7820ba8dce0335a3399260f582b","active":"jdnc_1_xiacheng210315_2","joinnum":"2"}',
  '{"smp":"58cfdd77d4ff2ed345f9e5aedb8de224","active":"jdnc_1_shanyaopian210601_2","joinnum":"2"}@{"smp":"d9da0248a3404803a2fd8174f3a20229","active":"jdnc_1_5yuanluosifen210305_2","joinnum":"1"}@{"smp":"e198a39894e21f65126eb8363f493630","active":"jdnc_1_dami210601_2","joinnum":"1"}@{"smp":"10c6ae43a3cf7ec7e283291092d627a6","active":"jdnc_1_3yuanganju210601_2","joinnum":"1"}@{"smp":"247c7f3bc6ffe8cff8208f834b4ca580","active":"jdnc_1_shanyaopian210601_2","joinnum":"1"}@{"smp":"dfa0c7820ba8dce0335a3399260f582b","active":"jdnc_1_xiacheng210315_2","joinnum":"2"}'
]
// 判断github action里面是否有京喜农场助力码
if (process.env.JXNC_SHARECODES) {
  if (process.env.JXNC_SHARECODES.indexOf('&') > -1) {
    console.log(`您的京喜农场助力码选择的是用&隔开\n`)
    JxncShareCodes = process.env.JXNC_SHARECODES.split('&');
  } else if (process.env.JXNC_SHARECODES.indexOf('\n') > -1) {
    console.log(`您的京喜农场助力码选择的是用换行隔开\n`)
    JxncShareCodes = process.env.JXNC_SHARECODES.split('\n');
  } else {
    JxncShareCodes = process.env.JXNC_SHARECODES.split();
  }
} else if (process.env.JD_COOKIE) {
  // console.log(`由于您secret里面未提供助力码，故此处运行将会给脚本内置的码进行助力，请知晓！`)
}
for (let i = 0; i < JxncShareCodes.length; i++) {
  const index = (i + 1 === 1) ? '' : (i + 1);
  exports['JxncShareCode' + index] = JxncShareCodes[i];
}
