const WebSocket = require('ws');

// WebSocket 서버 생성
const wss = new WebSocket.Server({ port: 8080 });

let clients = [];  // 연결된 클라이언트들을 저장할 배열
let nicknames = new Set();  // 사용 중인 닉네임을 저장할 Set

// 서버에서 시간 정보를 생성하는 함수
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleString();  // 서버 시간 반환
}

// WebSocket 서버에 연결된 클라이언트 처리
wss.on('connection', (ws) => {
    let nickname = null;  // 클라이언트의 닉네임을 저장할 변수

    // 클라이언트로부터 메시지를 받음
    ws.on('message', (message) => {
        message = message.toString().trim();  // 메시지에서 공백을 제거

        if (!nickname) {
            // 첫 번째 메시지가 닉네임이라면
            if (nicknames.has(message)) {
                // 닉네임이 이미 사용 중이라면
                ws.send("해당 닉네임은 이미 사용 중입니다. 다른 닉네임을 입력하세요.");
                return;  // 중복 닉네임이므로 더 이상 진행하지 않음
            } else {
                // 닉네임이 사용되지 않으면 등록
                nickname = message;
                ws.nickname = nickname;
                nicknames.add(nickname);  // 닉네임을 Set에 추가

                clients.push(ws);  // 클라이언트를 clients 배열에 추가
                
                // 모든 클라이언트에게 입장 메시지 전송
                console.log(`${nickname} 연결 완료`);

                // 자신에게 환영 메시지 전송
                let currentUsers = clients.map(client => client.nickname).join(", ");
                let totalUsers = clients.length;
                ws.send(`현재 채팅방에 있는 인원: ${currentUsers} (총 ${totalUsers}명)`);

                // 다른 클라이언트들에게 입장 메시지 전송
                clients.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(`${nickname}님이 채팅방에 입장 하였습니다. (${getCurrentTime()})`);
                    }
                });
            }
        } else {
            // 귓속말 처리
            if (message.startsWith('@')) {
                const parts = message.split(' ');
                const targetNickname = parts[0].substring(1); // '@' 이후 닉네임을 추출
                const privateMessage = parts.slice(1).join(' ');  // 귓속말 내용

                const targetClient = clients.find(client => client.nickname === targetNickname);

                if (targetClient) {
                    // 타겟 클라이언트에게 귓속말 전송
                    targetClient.send(`${nickname}님이 보낸 귓속말: ${privateMessage} (${getCurrentTime()})`);
                    ws.send(`${targetNickname}님에게 보낸 귓속말: ${privateMessage} (${getCurrentTime()})`);
                } else {
                    // 타겟 닉네임이 존재하지 않으면
                    ws.send(`해당 사용자 ${targetNickname}는 존재하지 않습니다.`);
                }
            } else {
                // 일반 메시지 처리
                console.log(`${nickname}가 보낸 메시지: ${message}`);

                // 메시지에 시간을 추가해서 모든 클라이언트에게 전송
                const timeMessage = `${message} (${getCurrentTime()})`;  // 시간만 포함한 메시지

                // 모든 클라이언트에게 메시지 전송 (자기 자신 제외)
                clients.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(`${nickname}: ${message} (${getCurrentTime()})`);
                    }
                });

                // 자기 자신에게는 시간 포함된 메시지만 보내기
                ws.send(timeMessage);  // 자기 자신에게는 nickname 없이 시간 포함된 메시지 전송
            }
        }
    });

    // 클라이언트 연결 종료 시 처리
    ws.on('close', () => {
        if (nickname) {
            // 클라이언트 퇴장 메시지
            console.log(`${nickname} 연결 종료`);

            // clients 배열에서 해당 클라이언트를 제거하고, 닉네임 Set에서도 삭제
            clients = clients.filter(client => client !== ws);  // 퇴장한 클라이언트를 clients에서 제거
            nicknames.delete(nickname);  // 해당 닉네임 삭제

            // 다른 클라이언트들에게 퇴장 메시지 전송
            clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(`${nickname}님이 채팅방을 퇴장 하였습니다. (${getCurrentTime()})`);
                }
            });

            // 퇴장 후에도 채팅방에 남아있는 인원 목록을 갱신하여 전송
            let currentUsers = clients.map(client => client.nickname).join(", ");
            let totalUsers = clients.length;
            clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(`현재 채팅방에 있는 인원: ${currentUsers} (총 ${totalUsers}명)`);
                }
            });
        }
    });

    // 에러 처리
    ws.on('error', (error) => {
        console.error(`WebSocket 에러 발생: ${error.message}`);
    });
});
