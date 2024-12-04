/*
* RANG TALK PROGRAM Ver 0.1
* 작성자 : 신예랑
* 내  용: 1:1 채팅 프로그램 ver 0.1(C스타일 코딩)
* 윈도우(클라이언트)
*/

#define _WINSOCK_DEPRECATED_NO_WARNINGS
#include<iostream>
#include<WinSock2.h>
#include<thread>
#include<mutex>
#include<string.h>
#define SIZE 1024
using namespace std;

mutex mtx;
SOCKET clnt_sock;

void Error_handling(const char* msg)
{
	fputs(msg, stderr);
	fputc('\n', stderr);
	exit(1);
}


void thread_send()
{
	char msg[SIZE];

	while (1)
	{
		fgets(msg, sizeof(msg), stdin);
		//mtx.lock();
		if (send(clnt_sock, msg, (int)strlen(msg), 0) == SOCKET_ERROR)
		{
			closesocket(clnt_sock);
			WSACleanup();
			Error_handling("send() error");
		}
		//mtx.unlock();
	}
}

void thread_recv()
{
	char buffer[SIZE];
	int bytes_recv = 0;

	while (1)
	{
		if ((bytes_recv = recv(clnt_sock, buffer, SIZE - 1, 0)) <= 0)
		{
			closesocket(clnt_sock);
			WSACleanup();
			Error_handling("recv() error");
		}
		//mtx.lock();
		buffer[bytes_recv] = '\0';
		printf("너 : %s", buffer);
		//mtx.unlock();
	}
}

int main()
{
	char* server_ip = (char*)"192.168.1.15";

	struct sockaddr_in serv_addr;

	// 0. 윈속 초기화
	WSADATA wsa_data;
	if (WSAStartup(MAKEWORD(2, 2), &wsa_data) != 0)
		Error_handling("WSAStartup() error");

	// 1. 클라이언트 소켓 생성
	clnt_sock = socket(AF_INET, SOCK_STREAM, 0);
	if (clnt_sock == INVALID_SOCKET)
		Error_handling("socket() error");

	// 2. 서버 정보 설정
	memset(&serv_addr, 0, sizeof(serv_addr));
	serv_addr.sin_family = AF_INET;
	serv_addr.sin_addr.s_addr = inet_addr(server_ip);
	serv_addr.sin_port = htons(9090);

	// 3. 서버에 연결
	if (connect(clnt_sock, (struct sockaddr*)&serv_addr, sizeof(serv_addr)) == SOCKET_ERROR)
	{
		closesocket(clnt_sock);
		WSACleanup();
		Error_handling("connect() error");
	}
	thread thread1(thread_send);
	thread thread2(thread_recv);
	thread1.join();
	thread2.join();

	// 6. 소켓 닫기
	closesocket(clnt_sock);
	// 7. 윈속 정리

	return 0;
}
