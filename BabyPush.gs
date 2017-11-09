iconUrl = "https://dashboard.push7.jp/uploads/xxxxxxxx.png"; // 通知アイコンの URL
pushUrl = "https://xxxxxxxxxx"; // 通知をタップしたときに開く URl
pushSendUrl = "https://api.push7.jp/api/v1/<userId>/send"; // push7 の送信先 URL
pushToken = "xxxxxxxxxxxxxxxxxxxxxxxx"; // push7 のトークン
googleSpreadSheetId = "XXXXXXXXXXXXXXXXXX"; // 記録する Google スプレッドシートの ID

function doGet(e) {
  var button = e.parameter.button;
  var offsetMin = e.parameter.offsetMin;
  return doGetInner(button, offsetMin);
}

function doGetInner(button, offsetMin) {
  switch (button) {
  case "wakeup":
    wakeup(offsetMin);
    break;
  case "milk":
    milk(offsetMin);
    break;
  case "pee":
    pee(offsetMin);
    break;
  case "poo":
    poo(offsetMin);
    break;
  default:
    var html = HtmlService.createTemplateFromFile("index");
    html.button = button;
    return html.evaluate()
           .addMetaTag('viewport', 'width=device-width, initial-scale=1')
           .setTitle('赤ちゃんプッシュ');
  }
  return "<html><body>OK</body><html>"; 
}

function wakeup(offsetMin) {
  Logger.log("wakeup()");
  var currentDate = getCurrentDate(offsetMin);
  var nextDate = addMin(currentDate, 90); // 眠りピークは起きてから90分後
  var message = "次の眠り90分周期は " + Utilities.formatDate(nextDate, 'Asia/Tokyo', 'HH:mm') + " 頃"
  record(offsetMin, "起きた", message);
  pushNotification(modTitle("起きたボタンが押されました", offsetMin), message, "");
  pushNotification("眠らせよう", message, addMin(nextDate, -10));
}

function milk(offsetMin) {
  Logger.log("milk()");
  var currentDate = getCurrentDate(offsetMin);
  var nextDate = addMin(currentDate, 180); // 次回のミルクは 3 時間語
  var message = "次のミルクは " + Utilities.formatDate(nextDate, 'Asia/Tokyo', 'HH:mm') + " 頃"
  record(offsetMin, "ミルク", message);
  pushNotification(modTitle("ミルクボタンが押されました", offsetMin), message, "");
  pushNotification("ミルクをあげよう", message, addMin(nextDate, -10));
}

function pee(offsetMin) {
  Logger.log("pee()");
  record(offsetMin, "おしっこ", "");
  pushNotification(modTitle("おしっこボタンが押されました", offsetMin), "おむつ替え、お疲れ様です！", "");
}

function poo(offsetMin) {
  Logger.log("poo()");
  record(offsetMin, "うんち", "");
  pushNotification(modTitle("うんちボタンが押されました", offsetMin), "おむつ替え、お疲れ様です！", "");
}

function modTitle(title, offsetMin) {
  if (offsetMin != null && offsetMin != 0) {
    return "(" + offsetMin + "分前)" + title;
  }
  return title;
}

function getCurrentDate(offsetMin) {
  var d = new Date();
  if (offsetMin != null) {
    d.setMinutes(d.getMinutes() - offsetMin);
  }
  return d;
}

function addMin(date, min) {
  var d = new Date(date.getTime());
  d.setMinutes(d.getMinutes() + min);
  return d;
}

function record(offsetMin, message, note) {
  var d = getCurrentDate(offsetMin);
  var spreadSheet = SpreadsheetApp.openById(googleSpreadSheetId);
  var sheet = spreadSheet.getSheets()[0];
  sheet.appendRow([d, message, note]);
}

function pushNotification(title, message, transmissionTime) {
  var url = pushSendUrl;
  var option = {
    "method" : "post",
    "headers" : {
      "Authorization": "Bearer " + pushToken
    },
    "contentType" : "application/json",
  };
  if (transmissionTime != undefined && transmissionTime != "") {
    option.payload = JSON.stringify({
      "title": title,
      "body": message,
      "icon": iconUrl,
      "url": pushUrl,
      "disappear_instantly": false,
      "transmission_time": Utilities.formatDate(transmissionTime, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm')
    });
  } else {
    option.payload = JSON.stringify({
      "title": title,
      "body": message,
      "icon": iconUrl,
      "url": pushUrl,
      "disappear_instantly": false
    });
  }
  var res = UrlFetchApp.fetch(url, option);
  Logger.log(option);
  Logger.log(res.getContentText());
  //return JSON.parse(res.getContentText()).keys[0];
}

function processForm(button, offsetMin) {
  Logger.log(button + "," + offsetMin);
  doGetInner(button, offsetMin);
}
