const board = document.getElementById('board');
const addBtn = document.getElementById('add-btn'); //要素取得
const peerIdInput = document.getElementById('peer-id-input');
const connectBtn = document.getElementById('connect-btn');
const addImgBtn = document.getElementById('add-img-btn');
const imgInput = document.getElementById('img-input');

let conn = null;

const colors = ['#fff9b1', '#ffd6e0', '#d0ebff', '#d3f9d8'];

function createCardElement(cardId, top = '150px', left = '150px', text = '', color = colors, imgData = null) {
  const card = document.createElement('div');
  card.className = 'card';
  card.id = cardId;
  card.style.top = top;
  card.style.left = left;
  card.style.backgroundColor = color;

  const actions = document.createElement('div');
  actions.className = 'card-actions';

  const colorBtn = document.createElement('button');
  colorBtn.className = 'card-btn';
  colorBtn.innerText = '⟲';
  colorBtn.addEventListener('click', () => {
    const currentIndex = colors.indexOf(card.dataset.color || colors[0]);
    const nextColor = colors[(currentIndex + 1) % colors.length];

    card.style.backgroundColor = nextColor;
    card.dataset.color = nextColor;
    sendData({ type: 'color', cardId: card.id, color: nextColor }); // 相手にも送る
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'card-btn';
  deleteBtn.innerText = '×';
  deleteBtn.addEventListener('click', () => {
        card.remove();
        sendData({ type: 'delete', cardId: card.id });
    });

    actions.appendChild(colorBtn);
    actions.appendChild(deleteBtn);

    const textArea = document.createElement('div');
    textArea.className = 'card-text';
    textArea.contentEditable = true;
    textArea.innerText = text;

    textArea.addEventListener('input', () => {
        sendData({ type: 'edit', cardId: card.id, text: textArea.innerText });
    });

    card.appendChild(actions);

    if (imgData) {
    const img = document.createElement('img');
    img.src = imgData;
    img.className = 'card-img';
    card.appendChild(img);
    textArea.style.minHeight = '30px';
    }
    card.appendChild(textArea);

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
}
addBtn.addEventListener('click', () =>{
    const newCardId = 'card-' + Date.now();         //カードid作成
    createCardElement(newCardId);
    sendData({ type: 'add', cardId: newCardId });
});

addImgBtn.addEventListener('click', () => {
    imgInput.click();
});

imgInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
   const reader = new FileReader();
   reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
      const maxWidth = 400;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const resizedData = canvas.toDataURL('image/jpeg', 0.7);

      const newCardId = 'card-' + Date.now();
      createCardElement(newCardId, '150px', '150px', '', colors, resizedData);
      sendData({ type: 'add-img', cardId: newCardId, imgData: resizedData });
      imgInput.value = '';
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
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
        targetCard.querySelector('.card-text').innerText = data.text;
      }
    }else if (data.type === 'color') {
      const targetCard = document.getElementById(data.cardId);
      if (targetCard) {
        targetCard.style.backgroundColor = data.color;
        targetCard.dataset.color = data.color;
      }
    } else if (data.type === 'delete') {
      const targetCard = document.getElementById(data.cardId);
      if (targetCard) {
        targetCard.remove();
      }
    }else if (data.type === 'add-img') {
      createCardElement(data.cardId, '150px', '150px', '', colors, data.imgData);
    }
  });
}