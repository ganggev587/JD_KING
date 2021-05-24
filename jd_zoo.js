/*
动物联萌 618活动
更新时间：2021-05-24 10:47
做任务，收金币
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
// quantumultx
[task_local]
#动物联萌
5 * * * * https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_zoo.js, tag=动物联萌, img-url=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/image/jd.png, enabled=true
// Loon
[Script]
cron "5 * * * *" script-path=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_zoo.js,tag=动物联萌
// Surge
动物联萌 = type=cron,cronexp=5 * * * *,wake-system=1,timeout=500,script-path=https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/scripts/jd/jd_zoo.js
*/
const $ = new Env('动物联萌');
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '',secretp = '',shareCodeList = [];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
} else {
  cookiesArr.push($.getdata('CookieJD'));
  cookiesArr.push($.getdata('CookieJD2'));
}

const JD_API_HOST = `https://api.m.jd.com/client.action?functionId=`;
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {"open-url": "https://bean.m.jd.com/"});
    return;
  }

  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    if (cookie) {
      if (i) console.log(`\n***************开始京东账号${i + 1}***************`)
      initial();
      await  QueryJDUserInfo();
      if (!merge.enabled)  //cookie不可用
      {
        $.setdata('', `CookieJD${i ? i + 1 : "" }`);//cookie失效，故清空cookie。
        $.msg($.name, `【提示】京东账号${i ? i + 1 : "" } cookie已过期！请先获取cookie\n直接使用NobyDa的京东签到获取`, 'https://bean.m.jd.com/', {"open-url": "https://bean.m.jd.com/"});
        continue;
      }
      console.log('\n\n京东账号：'+merge.nickname + ' 任务开始')
      await zoo_pk_getHomeData();
      await zoo_getHomeData();
      //await qryCompositeMaterials()
      await msgShow();
      //break;
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done())

//获取昵称（直接用，勿删）
function QueryJDUserInfo(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
        headers : {
          'Referer' : `https://wqs.jd.com/my/iserinfo.html`,
          'Cookie' : cookie
        }
      }
      $.get(url, (err, resp, data) => {
        try {
          data = JSON.parse(data);
          if (data.retcode === 13) {
            merge.enabled = false
            return
          }
          merge.nickname = data.base.nickname;
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//查询任务 "appSign":"2","channel":1,
function zoo_getTaskDetail(shopSign = "",appSign = "",timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      appSign = appSign&&'"appSign":"2","channel":1,'
      let url = {
        url : `${JD_API_HOST}zoo_getTaskDetail`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_getTaskDetail&body={${appSign}"shopSign":"${shopSign}"}&client=wh5&clientVersion=1.0.0`
      }
      //if (shopSign) {
        //console.log(shopSign)
      //  url.url = url.url.replace('zoo_getTaskDetail','zoo_shopLotteryInfo')
      //  url.body = url.body.replace('zoo_getTaskDetail','zoo_shopLotteryInfo')
      //}
      $.post(url, async (err, resp, data) => {
        try {
          //console.log('zoo_getTaskDetail:' + data)
          data = JSON.parse(data);
          if (shopSign === "") {
            shopSign = '""'
            if (appSign === "" && data.data.result) console.log(`您的个人助力码：${data.data.result.inviteId}`)
          }
          if (!data.data.result) return
          for (let i = 0;i < data.data.result.taskVos.length;i ++) {
            //if (merge.black)  return ;
            console.log( "\n" + data.data.result.taskVos[i].taskType + '-' + data.data.result.taskVos[i].taskName + (appSign&&"（微信小程序）") + '-'  +  (data.data.result.taskVos[i].status === 1 ? `已完成${data.data.result.taskVos[i].times}-未完成${data.data.result.taskVos[i].maxTimes}` : "全部已完成")  )
            if ([1,3,5,7,9,26].includes(data.data.result.taskVos[i].taskType) && data.data.result.taskVos[i].status === 1 ) {
              let list = data.data.result.taskVos[i].brandMemberVos||data.data.result.taskVos[i].followShopVo||data.data.result.taskVos[i].shoppingActivityVos||data.data.result.taskVos[i].browseShopVo
              //console.log(list)
              //if (data.data.result.taskVos[i].taskType === 9) continue
              for (let k = data.data.result.taskVos[i].times; k < data.data.result.taskVos[i].maxTimes; k++) {
                //body : `functionId=zoo_collectProduceScore&body={"ss":"{\\"extraData\\":{\\"is_trust\\":true,\\"sign\\":\\"${sign}\\",\\"fpb\\":\\"xAX3mMUyCgH120XCrQXIZUw==\\",\\"time\\":${time},\\"encrypt\\":\\"3\\",\\"nonstr\\":\\"${nonstr}\\",\\"jj\\":\\"\\",\\"token\\":\\"d89985df35e6a2227fd2e85fe78116d2\\",\\"cf_v\\":\\"1.0.1\\",\\"client_version\\":\\"2.1.3\\",\\"sceneid\\":\\"homePageh5\\"},\\"businessData\\":{\\"taskId\\":\\"collectProducedCoin\\",\\"rnd\\":\\"${rnd}\\",\\"inviteId\\":\\"-1\\",\\"stealId\\":\\"-1\\"},\\"secretp\\":\\"${secretp}\\"}"}&client=wh5&clientVersion=1.0.0`
                for (let j in list) {
                  if (list[j].status === 1) {
                    let rnd = Math.round(Math.random()*1e6)
                    let nonstr = randomWord(false,10)
                    let time = Date.now()
                    let key = minusByByte(nonstr.slice(0,5),String(time).slice(-5))
                    let msg = `random=${rnd}&token=d89985df35e6a2227fd2e85fe78116d2&time=${time}&nonce_str=${nonstr}&key=${key}&is_trust=true`
                    let sign = bytesToHex(wordsToBytes(getSign(msg))).toUpperCase() //,\"random\":\"${rnd}\"
                    let taskBody = `functionId=zoo_collectScore&body={"taskId":${data.data.result.taskVos[i].taskId},"taskToken" : "${list[j].taskToken}","ss":"{\\"extraData\\":{\\"is_trust\\":true,\\"sign\\":\\"${sign}\\",\\"fpb\\":\\"\\",\\"time\\":${time},\\"encrypt\\":\\"3\\",\\"nonstr\\":\\"${nonstr}\\",\\"jj\\":\\"\\",\\"token\\":\\"d89985df35e6a2227fd2e85fe78116d2\\",\\"cf_v\\":\\"1.0.2\\",\\"client_version\\":\\"2.2.1\\",\\"buttonid\\":\\"jmdd-react-smash_62\\",\\"sceneid\\":\\"homePageh5\\"},\\"secretp\\":\\"${secretp}\\",\\"random\\":\\"${rnd}\\"}","itemId":"${list[j].itemId}","actionType":1,"shopSign":${shopSign}}&client=wh5&clientVersion=1.0.0`
                    //console.log(taskBody)
                    console.log("\n"+(list[j].title||list[j].shopName))
                    await zoo_collectScore(taskBody,2000)
                    //}
                    list[j].status = 2;
                    break;
                  } else {
                    continue;
                  }
                }
              }
            }

            if ([12,13].includes(data.data.result.taskVos[i].taskType) && data.data.result.taskVos[i].status === 1) {
              //let  taskBody = `functionId=zoo_collectScore&body={"taskId":${data.data.result.taskVos[i].taskId},"itemId":"1","ss":"{\\"extraData\\":{},\\"businessData\\":{},\\"secretp\\":\\"${secretp}\\"}","shopSign":${shopSign}}&client=wh5&clientVersion=1.0.0`
              for (let k = data.data.result.taskVos[i].times; k < data.data.result.taskVos[i].maxTimes; k++) {
                let rnd = Math.round(Math.random()*1e6)
                let nonstr = randomWord(false,10)
                let time = Date.now()
                let key = minusByByte(nonstr.slice(0,5),String(time).slice(-5))
                let msg = `random=${rnd}&token=d89985df35e6a2227fd2e85fe78116d2&time=${time}&nonce_str=${nonstr}&key=${key}&is_trust=true`
                let sign = bytesToHex(wordsToBytes(getSign(msg))).toUpperCase()
                //let taskBody = `functionId=zoo_collectScore&body={"taskId":${data.data.result.taskVos[i].taskId},"itemId":"1","ss":"{\\"extraData\\":{\\"is_trust\\":true,\\"sign\\":\\"${sign}\\",\\"time\\":${time},\\"encrypt\\":\\"3\\",\\"nonstr\\":\\"${nonstr}\\",\\"jj\\":\\"\\",\\"token\\":\\"d89985df35e6a2227fd2e85fe78116d2\\",\\"cf_v\\":\\"1.0.1\\",\\"client_version\\":\\"2.1.3\\",\\"sceneid\\":\\"homePageh5\\"},\\"businessData\\":{\\"taskId\\":\\"${data.data.result.taskVos[i].taskId}\\",\\"rnd\\":\\"${rnd}\\",\\"inviteId\\":\\"-1\\",\\"stealId\\":\\"-1\\"},\\"secretp\\":\\"${secretp}\\"}","actionType":"1","shopSign":${shopSign}}&client=wh5&clientVersion=1.0.0`
                let taskBody = `functionId=zoo_collectScore&body={"taskId":${data.data.result.taskVos[i].taskId},"taskToken" : "${list[j].taskToken}","ss":"{\\"extraData\\":{\\"is_trust\\":true,\\"sign\\":\\"${sign}\\",\\"fpb\\":\\"\\",\\"time\\":${time},\\"encrypt\\":\\"3\\",\\"nonstr\\":\\"${nonstr}\\",\\"jj\\":\\"\\",\\"token\\":\\"d89985df35e6a2227fd2e85fe78116d2\\",\\"cf_v\\":\\"1.0.2\\",\\"client_version\\":\\"2.2.1\\",\\"buttonid\\":\\"jmdd-react-smash_62\\",\\"sceneid\\":\\"homePageh5\\"},\\"secretp\\":\\"${secretp}\\",\\"random\\":\\"${rnd}\\"}","itemId":"1","actionType":1,"shopSign":${shopSign}}&client=wh5&clientVersion=1.0.0`
                if (merge.black)  return ;
                  //if (typeof data.data.result.taskVos[i].simpleRecordInfoVo !== "undefined"){
                  //  taskBody = encodeURIComponent(`{"dataSource":"newshortAward","method":"getTaskAward","reqParams":"{\\"taskToken\\":\\"${data.data.result.taskVos[i].simpleRecordInfoVo.taskToken}\\"}","sdkVersion":"1.0.0","clientLanguage":"zh"}`)
                  //  await qryViewkitCallbackResult(taskBody,1000)
                  //} else {
                await zoo_collectScore(taskBody,1000)
                  //}
                }
            }

            if ([2].includes(data.data.result.taskVos[i].taskType) && data.data.result.taskVos[i].status === 1) {
              //for (let k = data.data.result.taskVos[i].times; k < data.data.result.taskVos[i].maxTimes; k++) {
              //  await zoo_getFeedDetail(data.data.result.taskVos[i].taskId)
              //}
            }
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//获取我的城市
function zoo_myMap(timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_myMap`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_myMap&body={"ss":"{\\"extraData\\":{},\\"businessData\\":{},\\"secretp\\":\\"${secretp}\\"}"}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          console.log('zoo_myMap:' + data)
          data = JSON.parse(data);
          for (let i in data.data.result.shopList) {
            // (data.data.result.shopList[i].status === 1) {
              //console.log(data.data.result.shopList[i])
            console.log('\n开始小镇任务：'+ data.data.result.shopList[i].name)// + '-' + data.data.result.shopList[i].shopId
            await zoo_getTaskDetail(data.data.result.shopList[i].shopId)
            //}
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//逛商城
function zoo_shopSignInWrite(shopSign,timeout = 0){
  return new Promise((resolve) => {

    let rnd = Math.round(Math.random()*1e6)
    let nonstr = randomWord(false,10)
    let time = Date.now()
    let key = minusByByte(nonstr.slice(0,5),String(time).slice(-5))
    let msg = `inviteId=-1&rnd=${rnd}&stealId=-1&taskId=${shopSign}&token=d89985df35e6a2227fd2e85fe78116d2&time=${time}&nonce_str=${nonstr}&key=${key}&is_trust=true`
    let sign = bytesToHex(wordsToBytes(getSign(msg))).toUpperCase()

    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_shopSignInWrite`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_shopSignInWrite&body={"shopSign":"${shopSign}","ss":"{\\"extraData\\":{\\"is_trust\\":true,\\"sign\\":\\"${sign}\\",\\"time\\":${time},\\"encrypt\\":\\"3\\",\\"nonstr\\":\\"${nonstr}\\",\\"jj\\":\\"\\",\\"token\\":\\"d89985df35e6a2227fd2e85fe78116d2\\",\\"cf_v\\":\\"1.0.1\\",\\"client_version\\":\\"2.1.3\\",\\"sceneid\\":\\"homePageh5\\"},\\"businessData\\":{\\"taskId\\":\\"${shopSign}\\",\\"rnd\\":\\"${rnd}\\",\\"inviteId\\":\\"-1\\",\\"stealId\\":\\"-1\\"},\\"secretp\\":\\"${secretp}\\"}"}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          if (data.data.bizCode !== 0) {
            console.log(data.data.bizMsg)
            merge.end = true
          } else {
            console.log('获得金币' + data.data.result.score)
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//逛商城
function zoo_shopSignInRead(shopSign,timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_shopSignInRead`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_shopSignInRead&client=wh5&clientVersion=1.0.0&body={"shopSign":"${shopSign}"}`
      }
      $.post(url, async (err, resp, data) => {
        try {
          console.log(data)
          data = JSON.parse(data);
          if (data.data.result.signInTag === 0) {
             secretp = secretp||data.data.result.secretp
             await zoo_shopSignInWrite(shopSign)
          } else {
            console.log('已逛过')
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//收金币
function zoo_collectProduceScore(timeout = 0){
  return new Promise((resolve) => {
    let rnd = Math.round(Math.random()*1e6)
    let nonstr = randomWord(false,10)
    let time = Date.now()
    let key = minusByByte(nonstr.slice(0,5),String(time).slice(-5))
    let msg = `random=${rnd}&token=d89985df35e6a2227fd2e85fe78116d2&time=${time}&nonce_str=${nonstr}&key=${key}&is_trust=true`
    let sign = bytesToHex(wordsToBytes(getSign(msg))).toUpperCase()
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_collectProduceScore`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_collectProduceScore&body={"ss":"{\\"extraData\\":{\\"is_trust\\":true,\\"sign\\":\\"${sign}\\",\\"fpb\\":\\"\\",\\"time\\":${time},\\"encrypt\\":\\"3\\",\\"nonstr\\":\\"${nonstr}\\",\\"jj\\":\\"\\",\\"token\\":\\"d89985df35e6a2227fd2e85fe78116d2\\",\\"cf_v\\":\\"1.0.2\\",\\"client_version\\":\\"2.2.1\\",\\"buttonid\\":\\"jmdd-react-smash_0\\",\\"sceneid\\":\\"homePageh5\\"},\\"secretp\\":\\"${secretp}\\",\\"random\\":\\"${rnd}\\"}"}&client=wh5&clientVersion=1.0.0`
      }
      //console.log(url.body)
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          if (data.data.bizCode === -1002) {
            //console.log('此账号暂不可使用脚本，脚本终止！')
            //merge.black = true;
            return ;
          }
          if (data.data.result) console.log(`\n收取金币：${data.data.result.produceScore}`)
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//获取可偷
function zoo_pk_getStealForms(taskBody,timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_pk_getStealForms`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : taskBody
      }
      $.post(url, async (err, resp, data) => {
        try {
          console.log(data)
          data = JSON.parse(data);
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}
//做任务
function zoo_collectScore(taskBody,timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_collectScore`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : taskBody
      }
      //console.log(url.body)
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          console.log('任务执行结果：' + data.data.bizMsg)
          if (data.data.bizCode === -1002) {
            //console.log(url.body)
            console.log('\n提示火爆，休息5秒')
            await $.wait(5000)
            //await zoo_collectScore(taskBody)
            //console.log('此账号暂不可使用脚本，脚本终止！')
            //merge.black = true;
            return ;
          }
          if (data.data.bizCode === 0 && typeof data.data.result.taskToken !== "undefined") {
            //console.log('需要再次执行,如提示活动异常请多次重试，个别任务多次执行也不行就去APP做吧！')
            let taskBody = encodeURIComponent(`{"dataSource":"newshortAward","method":"getTaskAward","reqParams":"{\\"taskToken\\":\\"${data.data.result.taskToken}\\"}","sdkVersion":"1.0.0","clientLanguage":"zh"}`)
            //console.log(taskBody)
            await qryViewkitCallbackResult(taskBody,7000)
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//做任务
function zoo_doAdditionalTask(taskBody,timeout = 0){
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_doAdditionalTask`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : taskBody
      }
      //console.log(url.body)
      $.post(url, async (err, resp, data) => {
        try {
          console.log(data)
          data = JSON.parse(data);
          console.log('任务执行结果：' + data.data.bizMsg)
          if (data.data.bizCode === -1002) {
            console.log('\n提示火爆，休息5秒')
            await $.wait(5000)
            return ;
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//查询甄选任务
function zoo_getFeedDetail(taskId,timeout = 0){
  return new Promise((resolve) => {

    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_getFeedDetail`,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_getFeedDetail&body={"taskId":"${taskId}"}&client=wh5&clientVersion=1.0.0`
      }
      //console.log(url)
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          let list =  data.data.result.viewProductVos||data.data.result.addProductVos
          for (let i in list) {
            if (list[i].status === 1) {
              for (let j in list[i].productInfoVos) {
                if (j >= 5)  break;

                let rnd = Math.round(Math.random()*1e6)
                let nonstr = randomWord(false,10)
                let time = Date.now()
                let key = minusByByte(nonstr.slice(0,5),String(time).slice(-5))
                let msg = `random=${rnd}&token=d89985df35e6a2227fd2e85fe78116d2&time=${time}&nonce_str=${nonstr}&key=${key}&is_trust=true`
                let sign = bytesToHex(wordsToBytes(getSign(msg))).toUpperCase() //,\"random\":\"${rnd}\"
                let taskBody = `functionId=zoo_collectScore&body={"taskId":${list[i].taskId},"ss":"{\\"extraData\\":{\\"is_trust\\":true,\\"sign\\":\\"${sign}\\",\\"fpb\\":\\"\\",\\"time\\":${time},\\"encrypt\\":\\"3\\",\\"nonstr\\":\\"${nonstr}\\",\\"jj\\":\\"\\",\\"token\\":\\"d89985df35e6a2227fd2e85fe78116d2\\",\\"cf_v\\":\\"1.0.2\\",\\"client_version\\":\\"2.2.1\\",\\"buttonid\\":\\"jmdd-react-smash_62\\",\\"sceneid\\":\\"homePageh5\\"},\\"secretp\\":\\"${secretp}\\",\\"random\\":\\"${rnd}\\"}","itemId":"${list[i].productInfoVos[j].skuId}","actionType":1}&client=wh5&clientVersion=1.0.0`
                //console.log(taskBody)
                //body={"taskId":${list[i].taskId},"itemId":"${list[i].productInfoVos[j].skuId}","ss":"{\\"extraData\\":{\\"is_trust\\":true,\\"sign\\":\\"${sign}\\",\\"time\\":${time},\\"encrypt\\":\\"3\\",\\"nonstr\\":\\"${nonstr}\\",\\"jj\\":\\"\\",\\"token\\":\\"d89985df35e6a2227fd2e85fe78116d2\\",\\"cf_v\\":\\"1.0.1\\",\\"client_version\\":\\"2.1.3\\",\\"sceneid\\":\\"homePageh5\\"},\\"random\\":\\"${rnd}\\",\\"secretp\\":\\"${secretp}\\"}","shopSign":""}&client=wh5&clientVersion=1.0.0`
                console.log(list[i].productInfoVos[j].skuName)
                await zoo_collectScore(taskBody,1000)
              }
              list[i].status = 2
            }
          }

        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//做任务2
function qryViewkitCallbackResult(taskBody,timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `https://api.m.jd.com/?functionId=qryViewkitCallbackResult&client=wh5&clientVersion=1.0.0&body=${taskBody}&_timestamp=`+Date.now(),
        headers : {
          'Origin' : `https://bunearth.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `*/*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`,
          'Content-Type' : 'application/x-www-form-urlencoded',
          'Referer' : 'https://bunearth.m.jd.com/babelDiy/Zeus/4SJUHwGdUQYgg94PFzjZZbGZRjDd/index.html?jmddToSmartEntry=login'
        }
       }

      $.get(url, async (err, resp, data) => {
        try {
          //console.log(url.url)
          //console.log(data)
          data = JSON.parse(data);
          console.log(data.toast.subTitle)
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//群组助力
function zoo_pk_assistGroup(inviteId = "",timeout = 0) {
  return new Promise((resolve) => {
    let rnd = Math.round(Math.random()*1e6)
    let nonstr = randomWord(false,10)
    let time = Date.now()
    let key = minusByByte(nonstr.slice(0,5),String(time).slice(-5))
    let msg = `random=${rnd}&token=d89985df35e6a2227fd2e85fe78116d2&time=${time}&nonce_str=${nonstr}&key=${key}&is_trust=true`
    let sign = bytesToHex(wordsToBytes(getSign(msg))).toUpperCase()
    //inviteId = "IgNWdiLGaPbb6ArIDg2g7t5ov9boGePFOlAq0hiVz-muX7bnH9gutA"
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_pk_assistGroup`  ,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.6;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`,
          'Refer' : `https://bunearth.m.jd.com/babelDiy/Zeus/4SJUHwGdUQYgg94PFzjZZbGZRjDd/index.html?jmddToSmartEntry=login`
        },
        body : `functionId=zoo_pk_assistGroup&body={"confirmFlag":1,"inviteId":"${inviteId}","ss":"{\\"extraData\\":{\\"is_trust\\":true,\\"sign\\":\\"${sign}\\",\\"time\\":${time},\\"encrypt\\":\\"3\\",\\"nonstr\\":\\"${nonstr}\\",\\"jj\\":\\"\\",\\"token\\":\\"d89985df35e6a2227fd2e85fe78116d2\\",\\"cf_v\\":\\"1.0.1\\",\\"client_version\\":\\"2.2.1\\",\\"buttonid\\":\\"pkPopupHelpButtonId\\",\\"sceneid\\":\\"sideTaskh5\\"},\\"secretp\\":\\"${secretp}\\",\\"random\\":\\"${rnd}\\"}"}&client=wh5&clientVersion=1.0.0`
      }
      //console.log(url.body)
      $.post(url, async (err, resp, data) => {
        try {
          //console.log('商圈助力：' + data)
          data = JSON.parse(data);
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

//获取首页信息
function zoo_getHomeData(inviteId= "",timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_getHomeData`  ,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_getHomeData&body={${inviteId ? "\"inviteId\":\"" + inviteId +'\"': ""}}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(url.body)
          //if (merge.black)  return ;
          data = JSON.parse(data);
          if (data.code === 0) {
            if (inviteId !== "") {
              //console.log('zoo_getHomeData2:' + JSON.stringify(data))
              //if (data.data.result.homeMainInfo.guestInfo.status === 0) {
               if (true) {
                let rnd = Math.round(Math.random()*1e6)
                let nonstr = randomWord(false,10)
                let time = Date.now()
                let key = minusByByte(nonstr.slice(0,5),String(time).slice(-5))
                let msg = `random=${rnd}&token=d89985df35e6a2227fd2e85fe78116d2&time=${time}&nonce_str=${nonstr}&key=${key}&is_trust=true`
                let sign = bytesToHex(wordsToBytes(getSign(msg))).toUpperCase()
                let taskBody = `functionId=zoo_collectScore&body={"taskId":2,"ss":"{\\"extraData\\":{\\"is_trust\\":true,\\"sign\\":\\"${sign}\\",\\"fpb\\":\\"\\",\\"time\\":${time},\\"encrypt\\":\\"3\\",\\"nonstr\\":\\"${nonstr}\\",\\"jj\\":\\"\\",\\"token\\":\\"d89985df35e6a2227fd2e85fe78116d2\\",\\"cf_v\\":\\"1.0.2\\",\\"client_version\\":\\"2.2.1\\",\\"buttonid\\":\\"jmdd-react-smash_62\\",\\"sceneid\\":\\"homePageh5\\"},\\"secretp\\":\\"${secretp}\\",\\"random\\":\\"${rnd}\\"}","inviteId":"${inviteId}","actionType":1}&client=wh5&clientVersion=1.0.0`
                await zoo_collectScore(taskBody, 1000)
                //let taskBody = `functionId=zoo_doAdditionalTask&body={"ss":"{\\"extraData\\":{\\"is_trust\\":true,\\"sign\\":\\"${sign}\\",\\"fpb\\":\\"\\",\\"time\\":${time},\\"encrypt\\":\\"3\\",\\"nonstr\\":\\"${nonstr}\\",\\"jj\\":\\"\\",\\"token\\":\\"d89985df35e6a2227fd2e85fe78116d2\\",\\"cf_v\\":\\"1.0.2\\",\\"client_version\\":\\"2.2.1\\",\\"buttonid\\":\\"homePopupHelpButtonId\\",\\"sceneid\\":\\"mainTaskh5\\"},\\"secretp\\":\\"${secretp}\\",\\"random\\":\\"${rnd}\\"}","inviteId":"cAxZdTXtIL3Z4wnNDAeu6UJH04V9-dkV6PTOUlAw2_pIXu8I-B8Mgnlc4UY"}&client=wh5&clientVersion=1.0.0`
                //await zoo_doAdditionalTask(taskBody,1000)
              }
              return
            }
            //console.log('zoo_getHomeData:' + JSON.stringify(data))
            secretp = data.data.result.homeMainInfo.secretp
            await zoo_collectProduceScore();
            await zoo_pk_getHomeData('sSKNX-MpqKOJsNu_mZneBluwe_DRzs1f90l6Q_p8OVxtoB-JJEErrVU4eHW7e2I')
            //await zoo_pk_assistGroup()
            if (data.data.result.homeMainInfo.raiseInfo.buttonStatus === 1 ) await zoo_raise(1000)
            await zoo_getHomeData('ZXTKT0225KkcRx4b8lbWJU72wvZZcwFjRWn6-7zx55awQ');
            //await zoo_getTaskDetail("","app")
            await zoo_getTaskDetail()
          } else {
            return
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}


//助力
function collectFriendRecordColor(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}collectFriendRecordColor`  ,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=collectFriendRecordColor&body={"mpin":"RnFgwWRbPDGKy9RP--twXV_3bZt2p2ZADl2v","businessCode":"20118","assistType":"1"}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          console.log(data)
          //data = JSON.parse(data);
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

function getEncryptedPinColor(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}getEncryptedPinColor`  ,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=getEncryptedPinColor&body={}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          data = JSON.parse(data);
          console.log('助力码:'+ data.result)
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

function zoo_raise(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_raise`  ,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_raise&body={}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          console.log('解锁结果：'+ (data.data.bizCode||'成功'))
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

function qryCompositeMaterials(timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}qryCompositeMaterials`  ,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=qryCompositeMaterials&body={"qryParam":"[{\\"type\\":\\"advertGroup\\",\\"mapTo\\":\\"viewLogo\\",\\"id\\":\\"05149412\\"},{\\"type\\":\\"advertGroup\\",\\"mapTo\\":\\"bottomLogo\\",\\"id\\":\\"05149413\\"}]","activityId":"2cKMj86srRdhgWcKonfExzK4ZMBy","pageId":"","reqSrc":"","applyKey":"21beast"}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          //console.log(data)
          data = JSON.parse(data);
          for (let i in data.data.viewLogo.list) {
            await zoo_getTaskDetail(data.data.viewLogo.list[i].desc)
          }
          for (let i in data.data.bottomLogo.list) {
            await zoo_getTaskDetail(data.data.bottomLogo.list[i].desc)
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

function zoo_pk_getHomeData(body = "",timeout = 0) {
  return new Promise((resolve) => {
    setTimeout( ()=>{
      let url = {
        url : `${JD_API_HOST}zoo_pk_getHomeData`  ,
        headers : {
          'Origin' : `https://wbbny.m.jd.com`,
          'Cookie' : cookie,
          'Connection' : `keep-alive`,
          'Accept' : `application/json, text/plain, */*`,
          'Host' : `api.m.jd.com`,
          'User-Agent' : `jdapp;iPhone;9.2.0;14.1;`,
          'Accept-Encoding' : `gzip, deflate, br`,
          'Accept-Language' : `zh-cn`
        },
        body : `functionId=zoo_pk_getHomeData&body={}&client=wh5&clientVersion=1.0.0`
      }
      $.post(url, async (err, resp, data) => {
        try {
          if (body !== "") {
            await $.getScript("https://raw.githubusercontent.com/yangtingxiao/QuantumultX/master/memo/jd_zooShareCode.txt").then((text) => (shareCodeList = text.split('\n')))
            for (let i in shareCodeList) {
              if (shareCodeList[i]) await zoo_pk_assistGroup(shareCodeList[i]);
            }
            //await zoo_pk_assistGroup(body);
          } else {
          data = JSON.parse(data);
          console.log('您的商圈助力码：' + data.data.result.groupInfo.groupAssistInviteId)
          }
        } catch (e) {
          $.logErr(e, resp);
        } finally {
          resolve()
        }
      })
    },timeout)
  })
}

function randomWord(randomFlag, min, max){
  let str = "",
    range = min,
    arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  // 随机产生
  if(randomFlag){
    range = Math.round(Math.random() * (max-min)) + min;
  }
  for(let i=0; i<range; i++){
    pos = Math.round(Math.random() * (arr.length-1));
    str += arr[pos];
  }
  return str;
}

function minusByByte(t, n) {
  var e = t.length
    , r = n.length
    , o = Math.max(e, r)
    , i = toAscii(t)
    , a = toAscii(n)
    , s = ""
    , u = 0;
  for (e !== r && (i = add0(i, o),
    a = this.add0(a, o)); u < o; )
    s += Math.abs(i[u] - a[u]),
      u++;
  return s
}

function toAscii (t) {
  var n = "";
  for (var e in t) {
    var r = t[e]
      , o = /[a-zA-Z]/.test(r);
    if (t.hasOwnProperty(e))
      if (o)
        n += getLastAscii(r);
      else
        n += r
  }
  return n
}
function add0 (t, n) {
  return (Array(n).join("0") + t).slice(-n)
}

function getLastAscii(t) {
  var n = t.charCodeAt(0).toString();
  return n[n.length - 1]
}

function wordsToBytes(t) {
  for (var n = [], e = 0; e < 32 * t.length; e += 8)
    n.push(t[e >>> 5] >>> 24 - e % 32 & 255);
  return n
}

function bytesToHex(t) {
  for (var n = [], e = 0; e < t.length; e++)
    n.push((t[e] >>> 4).toString(16)),
      n.push((15 & t[e]).toString(16));
  return n.join("")
}

function stringToBytes(t) {
  t = unescape(encodeURIComponent(t))
  for (var n = [], e = 0; e < t.length; e++)
    n.push(255 & t.charCodeAt(e));
  return n
}

function bytesToWords(t) {
  for (var n = [], e = 0, r = 0; e < t.length; e++,
    r += 8)
    n[r >>> 5] |= t[e] << 24 - r % 32;
  return n
}
function getSign (t) {
  t = stringToBytes(t)
  var e = bytesToWords(t)
    , i = 8 * t.length
    , a = []
    , s = 1732584193
    , u = -271733879
    , c = -1732584194
    , f = 271733878
    , h = -1009589776;
  e[i >> 5] |= 128 << 24 - i % 32,
    e[15 + (i + 64 >>> 9 << 4)] = i;
  for (var l = 0; l < e.length; l += 16) {
    for (var p = s, g = u, v = c, d = f, y = h, m = 0; m < 80; m++) {
      if (m < 16)
        a[m] = e[l + m];
      else {
        var w = a[m - 3] ^ a[m - 8] ^ a[m - 14] ^ a[m - 16];
        a[m] = w << 1 | w >>> 31
      }
      var _ = (s << 5 | s >>> 27) + h + (a[m] >>> 0) + (m < 20 ? 1518500249 + (u & c | ~u & f) : m < 40 ? 1859775393 + (u ^ c ^ f) : m < 60 ? (u & c | u & f | c & f) - 1894007588 : (u ^ c ^ f) - 899497514);
      h = f,
        f = c,
        c = u << 30 | u >>> 2,
        u = s,
        s = _
    }
    s += p,
      u += g,
      c += v,
      f += d,
      h += y
  }
  return [s, u, c, f, h]
}
//初始化
function initial() {
  merge = {
    nickname: "",
    enabled: true,
    end: false,
    black: false
  }
  for (let i in merge) {
    merge[i].success = 0;
    merge[i].fail = 0;
    merge[i].prizeCount = 0;
    merge[i].notify = "";
    merge[i].show = true;
  }
}
//通知
function msgShow() {
  console.log("\n\n京东账号："+merge.nickname + ' 任务已做完！\n如有未完成的任务，请多执行几次')
 //$.msg($.Name,"","京东账号："+merge.nickname + ' 任务已做完！\n如有未完成的任务，请多执行几次')
}

function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
