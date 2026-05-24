# Next Steps

## 1. Supabase 전환

- `LocalStorageAdapter`와 기능별 store를 Supabase Adapter로 교체
- Auth, profiles, friends, conversations, messages, crews, channels, files, events, posts 테이블 설계
- RLS 정책으로 DM/크루 접근 권한 제한
- Realtime 채널로 채팅과 Presence 연결

## 2. Windows 앱

- Tauri 셸 추가
- 게임 exe 실행, 프로세스 감지, 실행 시간 기록
- 로컬 파일 경로 선택과 다운로드 폴더 열기
- 트레이 상태, 자동 업데이트, OS 알림 연결

## 3. 모바일 앱

- PWA 설치 경험 개선
- Capacitor 패키징 검토
- 푸시 알림, 파일 공유, 카메라/앨범 첨부 연결

## 4. 기능 강화

- 크루 역할별 권한
- 메시지 검색 인덱스
- 파일 버전 관리
- 게시판 첨부 파일
- 일정 반복과 알림
- 초대 링크와 친구 요청 승인 흐름
