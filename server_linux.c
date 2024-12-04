/*
* RANG TALK PROGRAM Ver 0.1
* 작성자 : 신예랑
* 내  용: 1:1 채팅 프로그램 ver 0.1(C스타일 코딩)
* 리눅스 (서버)
*/https://github.com/KDS2626/RANG_TALK/tree/main

#include<stdio.h>
#include<pthread.h>
#include<sys/socket.h>  // socket
#include<string.h>      // memset
#include<arpa/inet.h>   // htonl, htons
#include<stdlib.h>      // atoi
#include<unistd.h>      // close
#define SIZE 1024

void Error_handling(char* msg)
{
    fputs(msg, stderr);
    fputc('\n', stderr);
    exit(1);
}

pthread_mutex_t mutex;
int clnt_sock, serv_sock;

// write
void *thread_send(void* arg)
{
    char msg[SIZE];

    while(1)
    {
        fgets(msg, sizeof(msg), stdin);
        pthread_mutex_lock(&mutex);
        if (send(clnt_sock, msg, strlen(msg), 0) != strlen(msg))
            Error_handling("send() error!");
        pthread_mutex_unlock(&mutex);
    }
}
// read
void *thread_recv(void* arg)
{
    char buffer[SIZE];
    int str_len;

    while(1)
    {
        // 데이터 수신
        if ((str_len = recv(clnt_sock, buffer, SIZE-1, 0)) <= 0)
        {
            close(clnt_sock);
            close(serv_sock);
            Error_handling("recv() error!");
        }
        buffer[str_len]='\0';
        pthread_mutex_lock(&mutex);
        printf("너 : %s", buffer);
        pthread_mutex_unlock(&mutex);
    }
}

int main(int argc, char *argv[])
{
    struct sockaddr_in serv_addr, clnt_addr;
    socklen_t clnt_addr_size = sizeof(clnt_addr);
    char clnt_ip[INET_ADDRSTRLEN];

    pthread_t t_id[2];
    pthread_mutex_init(&mutex, NULL);

    // 0. 입력체크
    if (argc != 2)
    {
        printf("Usage : %s <port>\n", argv[0]);
        return -1;
    }

    // 1. 서버 소켓 생성
    serv_sock = socket(AF_INET, SOCK_STREAM, 0);
    if (serv_sock == -1)
    {
        Error_handling("socket() error");
    }

    // 2. port번호 등 bind
    memset(&serv_addr, 0, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_addr.s_addr = htonl(INADDR_ANY);
    serv_addr.sin_port = htons(atoi(argv[1]));

    if (bind(serv_sock, (struct sockaddr*) &serv_addr, sizeof(serv_addr))==-1)
    {
        close(serv_sock);
        Error_handling("bind() error");
    }

    // 3. 연결 대기상태 진입
    if (listen(serv_sock, 5) == -1)
    {
        close(serv_sock);
        Error_handling("listen() error");
    }


    // 4. 클라이언트 요청에 따라 연결 수립
    clnt_sock = accept(serv_sock, (struct sockaddr*) &clnt_addr, &clnt_addr_size);
    if (clnt_sock == -1)
    {
        close(serv_sock);
        Error_handling("accept() error");
    }

    pthread_create(&t_id[1], NULL, thread_send, NULL);
    pthread_create(&t_id[0], NULL, thread_recv, NULL);

    for (int i=0; i<2; i++)
    {
        if (pthread_join(t_id[i], NULL))
        Error_handling("pthread_join() error");
    }

    // 7. 클라이언트 소켓 종료
    close(clnt_sock);

    // 8. 서버 소켓 종료
    close(serv_sock);

    return 0;
}
