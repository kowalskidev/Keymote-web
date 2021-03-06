import QrScanner from "./qr-scanner.min.js"; // if using plain es6 import
QrScanner.WORKER_PATH = "./qr-scanner-worker.min.js";

const qrVideo = document.querySelector("#qrVideo");
const loginCode = document.querySelector("#loginCode");
const controllerPage = document.querySelector("#controllerPage");
const loginPage = document.querySelector("#loginPage");

const container = document.querySelector(".container");
const keys = document.querySelectorAll(".key");

// if ("serviceWorker" in navigator) {
//   navigator.serviceWorker.register("/sw.js").then(function() {
//     console.log("Service Worker Registered");
//   });
// }
loginCode.addEventListener("mousewheel", e => {
  e.preventDefault();
});
window.oncontextmenu = function(event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
};

let wss;
let wasSocketConnected = false;

const lanServer = info => {
  function send(msg) {
    wss.send(JSON.stringify({ msg: msg }));
  }
  function broadcast(msg, room) {
    wss.send(JSON.stringify({ room: room, msg: msg }))
  }
  function join(room) {
    wss.send(JSON.stringify({ join: room }));
  }
  function bjoin() {
    //alert(group);
    join(group);
  }
  
  var ip = info.ip;
  var code = info.code;
  var group = code;
  
  // wss = new WebSocket('wss://'+ ip+ ':7698');

  wss = new WebSocket('wss://keymote.creativeshi.com/ws/' + code);

  wss.onerror = function (e) {
    console.error("Socket encountered error: ", e.message, "Closing socket");
    wss.close();
  }
  wss.onclose = function (e) {
    console.log(
      "Socket is closed. Reconnect will be attempted in 1 second.",
      e.reason
    );
    if (wasSocketConnected) {
      setTimeout(() => {
        connectToServer();
      }, 1000);
    }
  }
  wss.onopen = function () {
    console.log("Connected!"); 
    wasSocketConnected = true;
    controllerPage.style.display = "block";
    loginPage.style.display = "none";
    bjoin();
    qrScanner.stop();
    broadcast("hi", group);
  }
  wss.onmessage = function (ms) {
    console.log("received: %s", ms.data);
  }
  
};

// const connectToServer = info => {
  
//   console.log(info)

//   wss = new WebSocket(`wsss://keymote.creativeshi.com/wss/${info.code}`);

//   console.log(info.code);
//   wss.onopen = e => {
//     wasSocketConnected = true;
//     controllerPage.style.display = "block";
//     loginPage.style.display = "none";
//   };

//   wss.onclose = e => {
//     console.log(
//       "Socket is closed. Reconnect will be attempted in 1 second.",
//       e.reason
//     );
//     if (wasSocketConnected) {
//       setTimeout(() => {
//         connectToServer();
//       }, 1000);
//     }
//   };

//   wss.onerror = err => {
//     console.error("Socket encountered error: ", err.message, "Closing socket");
//     wss.close();
//   };

//   wss.onmessage = e => {
//     const keyInfo = JSON.parse(e.data);
//     simulateKey(keyInfo, config.preset);
//     console.log("received: %s", e.data);
//   };
// };

var code = undefined;
const qrScanner = new QrScanner(qrVideo, result => {
  console.log("decoded qr code:", result);
  const info = JSON.parse(result);
  // connectToServer(info);
  lanServer(info);
  loginCode.value = info.code;
  code = info.code;
  qrScanner.stop();
});

QrScanner.hasCamera().then(qrScanner.start());

// Create a manager to manager the element
const hammertime = new Hammer.Manager(container);
const Swipe = new Hammer.Swipe();

hammertime.add(Swipe);

hammertime.on("swipe", () => {});

hammertime.on("swipeleft", e => {
  console.log(e);
  keys[1].click();
});
hammertime.on("swiperight", e => {
  console.log(e);
});
hammertime.on("swipeup", e => {
  console.log(e);
});
hammertime.on("swipedown", e => {
  console.log(e);
});

const onlongtouch = msg => {
  console.log("long touch");

  const sendMsgRepeatedly = () => {
    wss.send(JSON.stringify(msg));
    msgTimer = setTimeout(sendMsgRepeatedly, 100);
  };
  sendMsgRepeatedly();
};

let timer;
let msgTimer;
const touchduration = 500; //length of time we want the user to touch before we do something

const touchstart = msg => {
  timer = setTimeout(() => onlongtouch(msg), touchduration);
};

const touchend = () => {
  //stops short touches from firing the event
  clearTimeout(msgTimer);

  if (timer) clearTimeout(timer); // clearTimeout, not cleartimeout..
};

keys.forEach(el => {
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    el.addEventListener("touchstart", () => {
      //send the id of element up,down,left right
      const keyInfo = { room: code, key: el.id, event: "down" };
      wss.send(JSON.stringify(keyInfo));
      touchstart(keyInfo);
    });

    el.addEventListener("touchend", () => {
      touchend();
      window.navigator.vibrate(10);
      //send the id of element up,down,left right
      const keyInfo = { room: code, room: code, key: el.id, event: "up" };
      wss.send(JSON.stringify(keyInfo));
    });
  } else {
    el.addEventListener("mousedown", () => {
      //send the id of element up,down,left right
      const keyInfo = { room: code, key: el.id, event: "down" };
      wss.send(JSON.stringify(keyInfo));
    });

    el.addEventListener("mouseup", () => {
      //send the id of element up,down,left right
      const keyInfo = { room: code, key: el.id, event: "up" };
      wss.send(JSON.stringify(keyInfo));
    });
  }
});
