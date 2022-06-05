//アプリケーション化
const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
let mainWindow;

var server = require('ws').Server;
var s = new server({ port: 5001 });

s.on('connection', function (ws) {


    mainWindow.webContents.send("message", number());

    //メッセージを受け取った時
    ws.on('message', function (message) {
        console.log("Received: " + message);

        s.clients.forEach(function (client) {
            client.send(message + ' : ' + new Date());
        });
    });

    ws.on('close', function () {
        mainWindow.webContents.send("message", number());
    });

});

function number() {
    let n = 0;
    s.clients.forEach(function () { n++ });
    return n;
}

// メインプロセス（受信側）
const { ipcMain } = require('electron') // ipc通信を読み込む
ipcMain.on('message', (event, arg) => { // イベントバインディング
    sendToClient(arg);
})

function sendToClient(inf) {
    s.clients.forEach(function (client) {
        client.send(inf);
    });
}


//ウィンドウを閉じたら終了
app.on('window-all-closed', function () {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

// Electronの初期化完了後に実行
app.on('ready', function () {
    // メイン画面の表示。ウィンドウの幅、高さを指定できる
    mainWindow = new BrowserWindow({
        width: 1290, height: 930, webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    mainWindow.loadURL('file://' + __dirname + '/index.html');
    //mainWindow.webContents.openDevTools();

    // ウィンドウが閉じられたらアプリも終了
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
});
