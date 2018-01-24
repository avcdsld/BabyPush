"use strict";
const Alexa = require('alexa-sdk');
//const https = require ('https');
const https = require('follow-redirects').https;

// Lambda関数のメイン処理
exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context); // Alexa SDKのインスタンス生成
    //alexa.appId = process.env.APP_ID;
    alexa.registerHandlers(handlers); // ハンドラの登録
    alexa.execute();                  // インスタンスの実行
};

const gasUrl = '<GASのURL>'; // TODO: GAS の URL を入力する

var handlers = {
    // インテントに紐付かないリクエスト
    'LaunchRequest': function () {
        this.emit('AMAZON.HelpIntent'); // AMAZON.HelpIntentの呼び出し
    },
    // スキルの使い方を尋ねるインテント
    'AMAZON.HelpIntent': function () {
        this.emit(':tell', '次のミルクの時間をお伝えします。ミルクボタン、起きたボタン、うんちボタン、おしっこボタンを押すこともできます。');
    },
    // 対話モデルで定義したインテント
    'PushMilkButtonIntent': function () {
        pushButton("milk", "ミルク", this);
    },
    'PushWakeupButtonIntent': function () {
        pushButton("wakeup", "起きた", this);
    },
    'PushPooButtonIntent': function () {
        pushButton("poo", "うんち", this);
    },
    'PushPeeButtonIntent': function () {
        pushButton("pee", "おしっこ", this);
    },
    'GetMilkTimeIntent': function () {
        var self = this;
        var body = "";
        const req = https.request(gasUrl + '?action=getMilkTime', (res) => {
            res.on('data', (chunk) => {
                console.log(chunk);
                body += chunk;
            });
            res.on('end', () => {
                console.log('No more data in response.');
                self.emit(':tell', body);
            });
        })
        req.on('error', (e) => {
            console.error(e);
            self.emit(':tell', 'すみません、予期せぬエラーが発生しました。');
        });
        req.end();
    },
    'GetMoodIntent': function () {
        var message = '機嫌をお伝えします。でもこの機能はまだ未実装です。すみません。';
        this.emit(':tell', message);
        console.log(message);
    }
};

function pushButton(button, buttonName, self) {
    var url = gasUrl
            + '?button=' + button + '&offsetMin=0';
    const req = https.request(url, (res) => {
        self.emit(':tell', buttonName + 'ボタンを押しました。');
    })
    req.on('error', (e) => {
        console.error(e);
        self.emit(':tell', 'すみません、予期せぬエラーが発生しました。');
    });
    req.end();
}
