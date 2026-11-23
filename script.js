const board = document.getElementById('board');
const addBtn = document.getElementById('add-btn'); //要素取得
const peerIdInput = document.getElementById('peer-id-input');
const connectBtn = document.getElementById('connect-btn');

let conn = null;

function createCardElement(cardId, top = '150px', left = '150px', text = '') {
  const card = document.createElement('div');
  card.className = 'card';
  card.id = cardId;                 //カードid
  card.contentEditable = true;
  card.style.top = top;
  card.style.left = left;
  card.innerText = text;

  card.addEventListener('input', () => {    //文字入力時
    sendData({ type: 'edit', cardId: card.id, text: card.innerText });
});
makeDraggable(card);
  board.appendChild(card);
}

function makeDraggable(card){
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    card.addEventListener('mousedown', (e) => {     //マウス押した時
        isDragging = true;
        offsetX = e.clientX - card.offsetLeft;
        offsetY = e.clientY - card.offsetTop;
        card.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {  //マウス動かした時
        if (!isDragging) return;
        card.style.left = (e.clientX - offsetX) + 'px';
        card.style.top = (e.clientY - offsetY) + 'px';
        sendData({
            type: 'move',
            cardId: card.id,
            top: card.style.top,
            left: card.style.left
        });
    });

    document.addEventListener('mouseup', () => {    //マウス離した時
        isDragging = false;
        card.style.cursor = 'grab';
    });
}

card.addEventListener('touchstart', (e) => {    //タッチ時用
    isDragging = true;
    const touch = e.touches[0];
    offsetX = touch.clientX - card.offsetLeft;
    offsetY = touch.clientY - card.offsetTop;
});

document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    card.style.left = (touch.clientX - offsetX) + 'px';
    card.style.top = (touch.clientY - offsetY) + 'px';
    sendData({
        type: 'move',
        cardId: card.id,
        top: card.style.top,
        left: card.style.left
    });
}, { passive: false });

document.addEventListener('touchend', () => {
    isDragging = false;
});

addBtn.addEventListener('click', () =>{
    const newCardId = 'card-' + Date.now();         //カードid作成
    createCardElement(newCardId);
    sendData({ type: 'add', cardId: newCardId });
});

//id取得↓ 
const myIdDisplay = document.getElementById('my-id');

const randomNumber = Math.floor(1000 + Math.random() * 9000);
const peer = new Peer('board-' + randomNumber);

peer.on('open', () => {
  myIdDisplay.innerText = randomNumber;
});
//id取得↑

peer.on('connection', (connection) => {        //相手から接続
  conn = connection;
  setupConnection();
  alert('相手と接続されました！');
});

connectBtn.addEventListener('click', () => {   //自分から接続
  const targetId = peerIdInput.value;
  if (!targetId) return;
  conn = peer.connect('board-' + targetId);
  setupConnection();
});

function sendData(data) {                       //データ送る
  if (conn && conn.open) {
    conn.send(data);
  }
}

function setupConnection() {                    //データ受け取った時
  conn.on('data', (data) => {
    if (data.type === 'add') {
      createCardElement(data.cardId);
    } else if (data.type === 'move') {
      const targetCard = document.getElementById(data.cardId);
      if (targetCard) {
        targetCard.style.top = data.top;
        targetCard.style.left = data.left;
      }
    } else if (data.type === 'edit') {
      const targetCard = document.getElementById(data.cardId);
      if (targetCard) {
        targetCard.innerText = data.text;
      }
    }
  });
}