/*
每日抽奖
活动时间：2021-05-01至2021-05-31
更新时间：2021-5-7
活动入口：京东APP首页搜索 "玩一玩"，每日抽奖
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
===================quantumultx================
[task_local]
#每日抽奖
13 1,22,23 * * * https://jdsharedresourcescdn.azureedge.net/jdresource/jd_daily_lottery.js, tag=每日抽奖, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true

=====================Loon================
[Script]
cron "13 1,22,23 * * *" script-path=https://jdsharedresourcescdn.azureedge.net/jdresource/jd_daily_lottery.js, tag=每日抽奖

====================Surge================
每日抽奖 = type=cron,cronexp="13 1,22,23 * * *",wake-system=1,timeout=3600,script-path=https://jdsharedresourcescdn.azureedge.net/jdresource/jd_daily_lottery.js

============小火箭=========
每日抽奖 = type=cron,script-path=https://jdsharedresourcescdn.azureedge.net/jdresource/jd_daily_lottery.js, cronexpr="13 1,22,23 * * *", timeout=3600, enable=true
*/
const $ = new Env('每日抽奖');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const activityCode = '1386931424925319168';
$.helpCodeList = [];
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [
    $.getdata("CookieJD"),
    $.getdata("CookieJD2"),
    ...$.toObj($.getdata("CookiesJD") || "[]").map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = $.UserName;
      await TotalBean();
      console.log(`\n*****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue
      }

      await dailyLottery()
    }
  }
  for (let i = 0; i < $.helpCodeList.length && cookiesArr.length > 0; i++) {
    if ($.helpCodeList[i].needHelp === 0) {
      continue;
    }
    for (let j = 0; j < cookiesArr.length && $.helpCodeList[i].needHelp !== 0; j++) {
      $.helpFlag = '';
      cookie = cookiesArr[j];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      if ($.helpCodeList[i].use === $.UserName) {
        continue;
      }
      console.log(`${$.UserName}助力:${$.helpCodeList[i].helpCpde}`);
      await helpFriend($.helpCodeList[i].helpCpde);
      if ($.helpFlag === true) {
        $.helpCodeList[i].needHelp -= 1;
      }
      cookiesArr.splice(j, 1);
      j--;
    }
  }

})()
    .catch((e) => {
      $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
      $.done();
    })

async function dailyLottery() {
  $.lotteryInfo = {};
  $.missionList = [];
  await Promise.all([getLotteryInfo(), getQueryMissionList()]);
  console.log(`初始化`);
  if ($.lotteryInfo.success !== true) {
    console.log(`${$.UserName}数据异常，执行失败`);
    return;
  }
  if ($.missionList.length === 0) {
    console.log(`${$.UserName}获取任务列表失败`);
  } else {
    await doMission();//做任务
    await $.wait(1000);
    await Promise.all([getLotteryInfo(), getQueryMissionList()]);
    // await doMission();//做任务
    // await $.wait(1000);
    // await Promise.all([getLotteryInfo(), getQueryMissionList()]);
  }
  await $.wait(1000);
  if ($.missionList.length === 0) {
    console.log(`${$.UserName}获取任务列表失败`);
  } else {
    await collectionTimes();//领任务奖励
    await $.wait(1000);
    await Promise.all([getLotteryInfo(), getQueryMissionList()]);
  }
  let drawNum = $.lotteryInfo.content.drawNum || 0;
  console.log(`共有${drawNum}次抽奖机会`);
  $.drawNumber = 1;
  for (let i = 0; i < drawNum; i++) {
    await $.wait(2000);
    //执行抽奖
    await lotteryDraw();
    $.drawNumber++;
  }
}

//助力
async function helpFriend(missionNo) {
  const body = `[{"userNo":"$cooMrdGatewayUid$","missionNo":"${missionNo}"}]`;
  const myRequest = getPostRequest('luckdraw/helpFriend', body);
  return new Promise(async resolve => {
    $.post(myRequest, (err, resp, data) => {
      try {
        /*
        * {"code":1,"content":true,"data":true,"errorMsg":"SUCCESS","msg":"SUCCESS","success":true}
        * */
        console.log(`助力结果:${data}`);
        data = JSON.parse(data);
        if (data.success === true && data.content === true) {
          console.log(`助力成功`);
          $.helpFlag = true;
        } else {
          $.helpFlag = false;
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

//做任务
async function collectionTimes() {
  console.log(`开始领任务奖励`);
  for (let i = 0; i < $.missionList.length; i++) {
    await $.wait(1000);
    if ($.missionList[i].status === 11) {
      let getRewardNos = $.missionList[i].getRewardNos;
      for (let j = 0; j < getRewardNos.length; j++) {
        await collectionOneMission($.missionList[i].title, getRewardNos[j]);//领奖励
        await $.wait(2000);
      }
    }
  }
}

//做任务
async function doMission() {
  console.log(`开始执行任务`);
  for (let i = 0; i < $.missionList.length; i++) {
    if ($.missionList[i].status !== 1) {
      continue;
    }
    await $.wait(3000);
    if ($.missionList[i].jumpType === 135) {
      await doOneMission($.missionList[i]);
    } else if ($.missionList[i].jumpType === 1) {
      await createInvitation($.missionList[i]);
    }
  }
}

//邀请好友来抽奖
async function createInvitation(missionInfo) {
  const body = `[{"userNo":"$cooMrdGatewayUid$","activityCode":"${activityCode}"}]`;
  const myRequest = getPostRequest('luckdraw/createInvitation', body)
  return new Promise(async resolve => {
    $.post(myRequest, (err, resp, data) => {
      try {
        //{"code": 1,"content": "ML:786c65ea-ca5c-4b3b-8b07-7ca5adaa8deb","data": "ML:786c65ea-ca5c-4b3b-8b07-7ca5adaa8deb","errorMsg": "SUCCESS","msg": "SUCCESS","success": true}
        data = JSON.parse(data);
        if (data.success === true) {
          $.helpCodeList.push({
            'use': $.UserName,
            'helpCpde': data.data,
            'needHelp': missionInfo['totalNum'] - missionInfo['completeNum']
          });
          console.log(`互助码(内部多账号自己互助)：${data.data}`);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

//领奖励
async function collectionOneMission(title, getRewardNo) {
  const body = `[{"userNo":"$cooMrdGatewayUid$","activityCode":"${activityCode}","getCode":"${getRewardNo}"}]`;
  const myRequest = getPostRequest('luckDraw/getDrawChance', body);
  return new Promise(async resolve => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success === true) {
          console.log(`${title}，领取任务奖励成功`);
        } else {
          console.log(JSON.stringify(data));
          console.log(`${title}，领取任务执行失败`);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

//做任务
async function doOneMission(missionInfo) {
  const body = `[{"userNo":"$cooMrdGatewayUid$","activityCode":"${activityCode}","missionNo":"${missionInfo.missionNo}","params":${JSON.stringify(missionInfo.params)}}]`;
  const myRequest = getPostRequest('luckdraw/completeMission', body);
  return new Promise(async resolve => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success === true) {
          console.log(`${missionInfo.title}，任务执行成功`);
        } else {
          console.log(JSON.stringify(data));
          console.log(`${missionInfo.title}，任务执行失败`);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

//获取任务列表
async function getQueryMissionList() {
  const body = `[{"userNo":"$cooMrdGatewayUid$","activityCode":"${activityCode}"}]`;
  const myRequest = getPostRequest('luckdraw/queryMissionList', body)
  return new Promise(async resolve => {
    $.post(myRequest, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success === true) {
          $.missionList = data.content.missionList;
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

//获取信息
async function getLotteryInfo() {
  const body = `[{"userNo":"$cooMrdGatewayUid$","activityCode":"${activityCode}"}]`;
  const myRequest = getPostRequest('luckdraw/queryActivityBaseInfo', body)
  return new Promise(async resolve => {
    $.post(myRequest, (err, resp, data) => {
      try {
        $.lotteryInfo = JSON.parse(data);
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}


async function lotteryDraw() {
  const body = `[{"userNo":"$cooMrdGatewayUid$","activityCode":"${activityCode}"}]`;
  const myRequest = getPostRequest('luckdraw/draw', body)
  return new Promise(async resolve => {
    $.post(myRequest, (err, resp, data) => {
      try {
        //console.log(`${data}`);
        data = JSON.parse(data);
        if (data.success === true) {
          console.log(`${$.name}第${$.drawNumber}次抽奖，获得：${data.content.rewardDTO.title || ' '}`);
        } else {
          console.log(`${$.name}第${$.drawNumber}次抽奖失败`);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function getPostRequest(type, body) {
  const url = `https://lop-proxy.jd.com/${type}`;
  const method = `POST`;
  const headers = {
    'Accept-Encoding': `gzip, deflate, br`,
    'Host': `lop-proxy.jd.com`,
    'Origin': `https://jingcai-h5.jd.com`,
    'Connection': `keep-alive`,
    'biz-type': `service-monitor`,
    'Accept-Language': `zh-cn`,
    'version': `1.0.0`,
    'Content-Type': `application/json;charset=utf-8`,
    "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0"),
    'Referer': `https://jingcai-h5.jd.com`,
    'ClientInfo': `{"appName":"jingcai","client":"m"}`,
    'access': `H5`,
    'Accept': `application/json, text/plain, */*`,
    'jexpress-report-time': `${new Date().getTime()}`,
    'source-client': `2`,
    'X-Requested-With': `XMLHttpRequest`,
    'Cookie': cookie,
    'LOP-DN': `jingcai.jd.com`,
    'AppParams': `{"appid":158,"ticket_type":"m"}`,
    'app-key': `jexpress`
  };
  return {url: url, method: method, headers: headers, body: body};
}


function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      url: "https://me-api.jd.com/user_new/info/GetJDUserInfoUnion",
      headers: {
        Host: "me-api.jd.com",
        Accept: "*/*",
        Connection: "keep-alive",
        Cookie: cookie,
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
        "Accept-Language": "zh-cn",
        "Referer": "https://home.m.jd.com/myJd/newhome.action?sceneval=2&ufc=&",
        "Accept-Encoding": "gzip, deflate, br"
      }
    }
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          $.logErr(err)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === "1001") {
              $.isLogin = false; //cookie过期
              return;
            }
            if (data['retcode'] === "0" && data.data && data.data.hasOwnProperty("userInfo")) {
              $.nickName = data.data.userInfo.baseInfo.nickname;
            }
          } else {
            $.log('京东服务器返回空数据');
          }
        }
      } catch (e) {
        $.logErr(e)
      } finally {
        resolve();
      }
    })
  })
}


// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,o)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let o=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");o=o?1*o:20,o=e&&e.timeout?e.timeout:o;const[r,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:o},headers:{"X-Key":r,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),o=JSON.stringify(this.data);s?this.fs.writeFileSync(t,o):i?this.fs.writeFileSync(e,o):this.fs.writeFileSync(t,o)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let o=t;for(const t of i)if(o=Object(o)[t],void 0===o)return s;return o}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),o=s?this.getval(s):"";if(o)try{const t=JSON.parse(o);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,o]=/^@(.*?)\.(.*?)$/.exec(e),r=this.getval(i),h=i?"null"===r?null:r||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,o,t),s=this.setval(JSON.stringify(e),i)}catch(e){const r={};this.lodash_set(r,o,t),s=this.setval(JSON.stringify(r),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)}):this.isQuanX()?$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:o,body:r}=t;e(null,{status:s,statusCode:i,headers:o,body:r},r)},t=>e(t)):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:o,body:r}=t;e(null,{status:s,statusCode:i,headers:o,body:r},r)},t=>e(t)))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:o,body:r}=t;e(null,{status:s,statusCode:i,headers:o,body:r},r)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:o,body:r}=t;e(null,{status:s,statusCode:i,headers:o,body:r},r)},t=>e(t))}}time(t){let e={"M+":(new Date).getMonth()+1,"d+":(new Date).getDate(),"H+":(new Date).getHours(),"m+":(new Date).getMinutes(),"s+":(new Date).getSeconds(),"q+":Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+"").substr(4-RegExp.$1.length)));for(let s in e)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:("00"+e[s]).substr((""+e[s]).length)));return t}msg(e=t,s="",i="",o){const r=t=>{if(!t||!this.isLoon()&&this.isSurge())return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}}};this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,r(o)):this.isQuanX()&&$notify(e,s,i,r(o)));let h=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join("\n")),this.logs=this.logs.concat(h)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
