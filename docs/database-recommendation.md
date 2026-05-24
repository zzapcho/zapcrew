# Database Recommendation

## 1순위: Supabase

ZapCrew의 기본 추천은 Supabase입니다.

- Auth로 계정과 세션 관리
- Postgres로 친구, DM, 크루, 채널, 게시글, 일정의 관계형 구조 관리
- Realtime으로 채팅, Presence, 알림 구현
- Storage로 드라이브 파일 저장
- Row Level Security로 크루/채널/DM 권한 분리 가능

교체 대상 파일은 `src/shared/storage/*Adapter.js`와 `src/features/*/storage/*Store.js`입니다.

## 2순위: PocketBase

직접 서버를 운영할 수 있고 친구들끼리 소규모로 쓰는 목적이면 PocketBase도 좋습니다.

- 단일 바이너리라 운영이 간단함
- Auth, DB, 파일 스토리지가 함께 있음
- 소규모 커뮤니티 운영에 적합

## 3순위: Firebase

모바일과 실시간 기능에 강합니다.

- Auth, Firestore, Storage, FCM 조합이 안정적
- 모바일 푸시 알림과 오프라인 동기화가 좋음
- 관계형 구조와 복잡한 권한 모델은 Supabase/Postgres보다 불편할 수 있음

## 4순위: Cloudflare D1/R2/Workers

배포와 스토리지, 엣지 실행에 강한 선택지입니다.

- Workers로 API 서버 구성
- D1로 SQL 데이터 저장
- R2로 파일 저장
- 실시간 채팅과 Presence는 Durable Objects, WebSocket 등을 직접 설계해야 함
