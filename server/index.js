// レンダラプロセス（送信側）
const { ipcRenderer } = require('electron'); // ipc通信を読み込む
const { futimesSync } = require('original-fs');

let chooseNumber = 0;
let ipAddress = "localhost";
let connectionNumber = 0;
let nowColor = [];

let paletteNumber = 50;

let loopColor = [];
let loopNumber = 0;
let loopMode = false;
let fadeMode = false;
let BPM = 120;

let keys = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "z", "x", "c", "v", "b", "n", "m"];

let onlineMode = true;

ipcRenderer.on('message', (event, arg) => {
    connectionNumber = arg;
    document.getElementById("connectionNumber").innerHTML = "接続中：" + connectionNumber + "人";
    initializeForClient();
});

function changeColor(color) {
    //console.log(color + "に色が変更されました。");
    document.getElementById("nowColorMihon").style.backgroundColor = color;
    ipcRenderer.send('message', color); // 'message'というイベントを実行
}

function sendInformation(inf) {
    ipcRenderer.send('message', inf);
}

function changeLoopMode(checkbox) {
    loopMode = checkbox.checked;
    if (loopMode && loopColor.length > 0) {
        loop();
    } else {
        loopMode = false;
        loopNumber = 0;
    }

    if (loopColor.length == 0) {
        alert("ループする色を選んでください。");
        loopMode = false;
        checkbox.checked = false;
    }
}

function changeBPM() {
    BPM = document.getElementById("BPM").value;
    sendInformation("&" + BPM);
}

function changeFadeMode(checkbox) {
    fadeMode = checkbox.checked;
    sendInformation("$" + fadeMode);
}

function initializeForClient() {
    sendInformation("$" + fadeMode);
    sendInformation("&" + BPM);

}

function loop() {
    changeColor(nowColor[loopColor[loopNumber]]);
    if (loopMode) {
        setTimeout(function () {
            loopNumber = (loopNumber + 1) % loopColor.length;
            loop();
        }, 60 / BPM * 1000);
    }

}

function choose(n) {
    if (chooseNumber == n) {
        //ループ用に設定
        if (loopColor.includes(n)) {
            loopColor = loopColor.filter(item => item != n);
        } else {
            loopColor.push(n);
        }
        //ボタンに番号を振る
        //まず全て外す
        for (let i = 0; i < paletteNumber; i++) {
            document.getElementById("palette" + i).value = "";
        }

        drawKey();

        //番号を振る
        for (let i = 0; i < loopColor.length; i++) {
            document.getElementById("palette" + loopColor[i]).value += ":" +  (i + 1);
        }
    }
    chooseNumber = n;
    for (let i = 0; i < paletteNumber; i++) {
        document.getElementById("palette" + i).style.border = "1px black solid";
        document.getElementById("palette" + i).style.marginRight = "3px";
        document.getElementById("palette" + i).style.marginLeft = "3px";
    }


    for (let i = 0; i < loopColor.length; i++) {
        document.getElementById("palette" + loopColor[i]).style.border = "6px green solid";
        document.getElementById("palette" + loopColor[i]).style.marginRight = "3px";
        document.getElementById("palette" + loopColor[i]).style.marginLeft = "3px";
    }

    document.getElementById("palette" + n).style.border = "6px red solid"

    changeColor(nowColor[n]);

}

let link = document.createElement("link");

function paletteColor() {
    document.getElementById("palette" + chooseNumber).style.backgroundColor = document.getElementById("color").value;
    nowColor[chooseNumber] = document.getElementById("color").value;
    storePalette();
}

function initialize() {


    //パレット作成
    for (let i = 0; i < paletteNumber; i++) {
        document.getElementById("palette").innerHTML += "<input type='button' class='palette' id='palette" + i + "' onclick='choose(" + i + ")'></input>"
        if (i % (paletteNumber / 5) == 9) document.getElementById("palette").innerHTML += "</br>";
        //document.getElementById("palette").innerHTML += "<div class='palette' id='palette" + i + "' onclick='choose(" + i + ")'></div>";
        document.getElementById("palette" + i).style.marginRight = "3px";
        document.getElementById("palette" + i).style.marginLeft = "3px";
    }

    //白で埋める
    for (let i = 0; i < paletteNumber; i++) {
        document.getElementById("palette" + i).style.backgroundColor = "#ffffff";
        nowColor[i] = "#ffffff";
    }

    link.href = "style.css";
    link.type = "text/css";
    link.rel = "stylesheet";
    document.getElementsByTagName("head")[0].appendChild(link);

    changeBPM();
    drawKey();
}
initialize();


function showQR() {
    document.getElementById("qrcode").innerHTML = "";
    let url;
    if (onlineMode) {
        url = "http://hayato227.html.xdomain.jp/Live/Client.html?ip=" + ipAddress + ":5001";
        new QRCode(document.getElementById("qrcode"), url);
    } else {
        url = "http://" + ipAddress + "/Live/Client.html?ip=" + ipAddress + ":5001";
        new QRCode(document.getElementById("qrcode"), url);
    }
    document.getElementById("url").innerHTML = url;
}

function getUserIP(onNewIP) { //  onNewIp - your listener function for new IPs
    //compatibility for firefox and chrome
    var myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    var pc = new myPeerConnection({
        iceServers: []
    }),
        noop = function () { },
        localIPs = {},
        ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g,
        key;

    function iterateIP(ip) {
        if (!localIPs[ip]) onNewIP(ip);
        localIPs[ip] = true;
    }

    //create a bogus data channel
    pc.createDataChannel("");

    // create offer and set local description
    pc.createOffer().then(function (sdp) {
        sdp.sdp.split('\n').forEach(function (line) {
            if (line.indexOf('candidate') < 0) return;
            line.match(ipRegex).forEach(iterateIP);
        });

        pc.setLocalDescription(sdp, noop, noop);
    }).catch(function (reason) {
        // An error occurred, so handle the failure to connect
    });

    //listen for candidate events
    pc.onicecandidate = function (ice) {
        if (!ice || !ice.candidate || !ice.candidate.candidate || !ice.candidate.candidate.match(ipRegex)) return;
        ice.candidate.candidate.match(ipRegex).forEach(iterateIP);
    };
}

// Usage
getUserIP(function (ip) {
    //IPアドレスの表示
    document.getElementById("spanForIpAddress").innerHTML += "<input type='radio' name='ip' value='" + ip + "' onchange='setIpAddress(\"" + ip + "\")'>" + ip;

});

function setIpAddress(ip) {
    document.getElementById("ipAddress").innerHTML = ip;
    ipAddress = ip;
    showQR();
}

function changeOnlineMode(mode) {
    if (mode == "offline") {
        onlineMode = false;
    } else {
        onlineMode = true;
    }
    showQR();
}

function storePalette() {
    let tmpText = JSON.stringify(nowColor);
    document.getElementById("paste").value = tmpText;
}

function loadPalette() {
    let tmpString = document.getElementById("paste").value;
    nowColor = JSON.parse(tmpString);
    for (let i = 0; i < nowColor.length; i++) {
        document.getElementById("palette" + i).style.backgroundColor = nowColor[i];
    }
}

function drawKey() {
    for(let i = 0; i < keys.length; i++) {
        document.getElementById("palette" + i).value = keys[i];
    }
}

document.addEventListener("keydown", keydown, false);
function keydown(e) {
    for(let i = 0; i < keys.length; i++) {
        if(e.key == keys[i]) {
            choose(i);
        }
    }
}