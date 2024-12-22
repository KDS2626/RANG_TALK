// WebSocket 서버에 연결
const socket = new WebSocket("ws://localhost:8080");

let nickname = null; // 닉네임 변수

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleString();  // 서버 시간 반환: 예: "2024-12-21 15:00:00"
}


// 채팅 메시지 출력 함수
function displayMessage(message, sender) {
    const messageElement = document.createElement("div");

    if (sender === 'system' || sender === 'system-message') {
        messageElement.classList.add('system-message');  // 시스템 메시지 스타일 추가
    } else if (sender === 'me') {
        messageElement.classList.add('me');
    } else {
        messageElement.classList.add('other');
    }

    messageElement.innerHTML = message;  // message는 HTML을 포함하는 문자열로, innerHTML로 처리
    messageContainer.appendChild(messageElement);

    messageContainer.scrollTop = messageContainer.scrollHeight;  // 항상 맨 아래로 스크롤
}



// WebSocket 연결 열림 시
socket.onopen = function() {
    console.log("서버에 연결되었습니다.");
};

// 서버로부터 메시지를 받았을 때 처리
socket.onmessage = function(event) {
    const message = event.data;
    console.log("서버에서 받은 메시지:", message);

    const timeMessage = `${getCurrentTime()}`;  // 서버로부터 받은 시간

    // 메시지가 입장 또는 퇴장 메시지인 경우
    if (message.includes("님이 채팅방에 입장 하였습니다.") || message.includes("님이 채팅방을 퇴장 하였습니다.")) {
        displayMessage(message, 'system');
    } else {
        const parts = message.split(": ");
        if (parts.length > 1) {
            const sender = parts[0];  // 메시지를 보낸 사람
            const text = parts[1];    // 메시지 내용
            if (sender === nickname) {
                // 본인이 보낸 메시지일 경우에는 "nickname: "을 빼고 메시지만 표시
                displayMessage(`${text} ${timeMessage}`, 'me');
            } else {
                // 다른 사람이 보낸 메시지일 경우에는 "nickname: 메시지" 형식
                displayMessage(`${sender}: ${text} ${timeMessage}`, 'other');
            }
        }
    }
};


// 메시지 전송 함수
function sendMessage() {
    console.log(222);
    const messageInput = document.getElementById("messageInput");
    let message = messageInput.value.trim();

    if (message === "") {
        return;  // 빈 메시지 전송 방지
    }

    // 메시지에 현재 시간 추가 (getCurrentTime() 함수가 현재 시간을 반환한다고 가정)
    message += ` (${getCurrentTime()})`;  // 시간을 메시지 뒤에 추가

    // 본인의 메시지를 화면에 표시
    displayMessage(message, 'me');
    socket.send(message);  // 서버로 메시지 전송
    console.log(message + "보내려 함");

    // 입력란 비우기
    messageInput.value = "";
}



// 전송 버튼 클릭 시 메시지 전송
document.getElementById("sendButton").addEventListener("click", sendMessage);

// 엔터 키로 메시지 전송
document.getElementById("messageInput").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

// 닉네임 설정
document.getElementById("nicknameSubmit").addEventListener("click", function() {
    nickname = document.getElementById("nicknameInput").value.trim();

    if (!nickname) {
        alert("닉네임을 입력해주세요.");
        return;
    }

    socket.send(nickname);  // 서버에 닉네임 전송
    document.getElementById("nicknameInput").disabled = true;
    document.getElementById("nicknameSubmit").disabled = true;
    document.getElementById("messageInput").disabled = false;
    document.getElementById("sendButton").disabled = false;

    // 본인의 입장 메시지를 화면에 표시
    displayMessage(`${nickname}님이 채팅방에 입장 하였습니다.`, 'system');
});
