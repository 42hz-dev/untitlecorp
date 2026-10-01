# untitle

Nginx + NestJS(TypeScript) + MariaDB 개발 환경 (Docker Compose)

| 구성 | 버전 |
|---|---|
| Nginx | 1.30 (stable) |
| Node | 24 (LTS) |
| MariaDB | 11.4 (LTS) |

> 로컬에 Node 설치 없이 **모든 작업을 Docker로** 처리합니다.

## 폴더 구조

```
untitle/
├── .env                  # DB 계정 정보 (git 제외)
├── .env.example          # .env 템플릿
├── .gitignore
├── docker-compose.yml
├── nginx/
│   ├── default.conf      # 사이트별 server 블록 (web, crm)
│   └── proxy_headers.conf  # 공통 프록시 헤더
├── web/                  # web 사이트 정적 파일
├── web-api/              # web 사이트 NestJS (서비스명: web-api)
├── crm/                  # crm 사이트 정적 파일
└── crm-api/              # crm 사이트 NestJS (서비스명: crm-api)
```

## 요청 흐름

```
브라우저 → :80 nginx ─┬─ localhost       ─┬─ /         → web/ 정적 파일
                      │                    └─ /api/...  → web-api :3000 (web-api/)
                      └─ crm.localhost   ─┬─ /         → crm/ 정적 파일
                                           └─ /api/...  → crm-api :3000 (crm-api/)
```

- 사이트는 `Host` 로 구분합니다. 로컬에서는 `http://localhost`, `http://crm.localhost` 로 접속합니다.

- 모든 Nest 경로는 `/api` 로 시작합니다. (`main.ts` 의 `setGlobalPrefix('api')`)
- 프론트에서는 `fetch('/api/...')` 처럼 호출합니다. (3000번 포트 직접 호출 X)

## 첫 실행 (처음 한 번만)

### 1. `.env` 파일 생성

```bash
cp .env.example .env
```

`.env` 에 값을 채웁니다.

```
DB_ROOT_PASSWORD=root1234
DB_NAME=app
DB_USER=app
DB_PASSWORD=app1234
```

### 2. Nest 프로젝트 생성

`web-api/`, `crm-api/` 폴더가 없을 때만 실행합니다. (crm은 마지막 인자만 `crm-api` 로 변경)

```bash
docker run --rm -it -v "$PWD":/work -w /work node:24-alpine \
  npx @nestjs/cli new web-api --package-manager npm --skip-git --no-observe
```

### 3. 실행

```bash
docker compose up -d
```

`web-api`, `crm-api` 는 `npm install` + 컴파일 때문에 뜨는 데 시간이 걸립니다.
로그에 `Nest application successfully started` 가 뜬 뒤 `http://localhost`, `http://crm.localhost` 에 접속합니다.

## 기본 명령어

```bash
docker compose up -d          # 실행 (백그라운드)
docker compose down           # 중지
docker compose restart web-api      # web-api만 재시작 (crm-api도 동일)
docker compose ps                   # 상태 확인
docker compose logs -f web-api      # web-api 로그 보기 (Ctrl+C로 종료)
```

## npm 명령어 사용법

npm 명령은 **항상 컨테이너 안에서** 실행합니다. (컨테이너가 떠 있어야 함)
아래 예시는 `web-api` 기준이며, crm 쪽은 `crm-api` 로 바꿔서 실행합니다.

```bash
# 패키지 설치
docker compose exec web-api npm install <패키지명>

# 개발용 패키지 설치
docker compose exec web-api npm install -D <패키지명>

# Nest CLI (모듈/컨트롤러/서비스 생성)
docker compose exec web-api npx nest g resource users
docker compose exec web-api npx nest g module users

# 테스트
docker compose exec web-api npm run test
```

> `web-api/node_modules`, `crm-api/node_modules` 는 Linux(alpine)용으로 설치됩니다.
> Mac에서 직접 `npm` 명령을 실행하지 마세요.

## nginx 설정 변경

`nginx/default.conf` 또는 `nginx/proxy_headers.conf` 수정 후:

```bash
docker compose exec nginx nginx -t         # 문법 검사
docker compose exec nginx nginx -s reload  # 적용
```

## 컨테이너 접속

```bash
# web-api 컨테이너 쉘 접속 (alpine이라 bash 대신 sh)
docker compose exec web-api sh

# nginx 컨테이너 접속
docker compose exec nginx sh

# MariaDB 접속 (.env의 DB_USER / DB_PASSWORD)
docker compose exec db mariadb -u app -p app
```

나가기: `exit`