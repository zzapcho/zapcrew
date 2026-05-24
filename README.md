# ZapCrew

ZapCrew는 친구들끼리 쓰는 올인원 커뮤니티 허브 1차 Web/PWA 버전입니다. UI는 `zzapcho/zzapcho-online` 런처의 titlebar, sidebar, content, 버튼, 카드, warm dark brown + gold accent 톤을 기준으로 확장했습니다.

## 실행 방법

Windows에서 압축을 푼 뒤 `start-zapcrew.bat`를 실행하면 됩니다.

이제 Node/npm은 필요하지 않습니다. Python 3만 있으면 실행됩니다.

```bat
start-zapcrew.bat
```

직접 실행하려면 아래 명령을 사용하세요.

```bash
py -3 scripts/serve.py
```

또는:

```bash
python scripts/serve.py
```

브라우저에서 `http://127.0.0.1:5173`을 열면 됩니다.

## 빌드/배포 폴더 만들기

정적 파일을 `dist/` 폴더로 복사하려면 Python 빌드 스크립트를 실행합니다.

```bash
py -3 scripts/build.py
```

빌드 결과를 미리 보려면:

```bash
py -3 scripts/serve.py dist
```

## 기능

- 로컬 계정 생성, 로그인, 로그아웃, 프로필/아바타 색상 수정
- 친구 추가, 검색, 상태 표시, 삭제, 친구 DM 생성
- 1:1 DM, 단체 DM, 메시지 전송/삭제, 첨부명, 이모지 반응
- 크루 생성, 기본 공지/일반/게임모집 채널, 채널 추가, 채널 메시지, 멤버/역할 구조
- 온라인/자리비움/방해금지/오프라인, 커스텀 상태, 현재 플레이 중 게임
- 게임 등록, URL 실행, Steam URL 저장 가능, 고정 게임, 최근 실행
- 드라이브 폴더, 파일 업로드, IndexedDB Blob 저장, 다운로드, 삭제
- 일정 추가, 개인/크루 구분, 참여/불참, 오늘 일정
- 게시판, 게시글, 댓글, 좋아요/반응, 투표, 삭제
- 홈 대시보드, 검색/Ctrl+K, JSON 내보내기/가져오기, 데이터 초기화
- PWA manifest, service worker, 오프라인 기본 캐싱, 앱 아이콘

## 폴더 구조

```text
src/
  app/
  features/
    auth/
    friends/
    chat/
    crews/
    presence/
    games/
    drive/
    calendar/
    community/
    notifications/
  shared/
    storage/
    types/
    utils/
  styles/
public/
  icons/
docs/
scripts/
```

## 저장 방식

현재는 DB 없이 `localStorage`와 `IndexedDB`로 동작합니다. 일반 앱 상태는 `src/shared/storage/LocalStorageAdapter.js`, 드라이브 파일 Blob은 `src/shared/storage/IndexedDBAdapter.js`가 담당합니다.

Supabase로 이전할 때는 `src/features/*/storage/*Store.js`와 `src/shared/storage/*Adapter.js`를 Supabase 구현으로 교체하면 됩니다. 화면 코드는 store API를 호출하도록 분리했습니다.

## 확장 방향

Windows 앱은 Tauri가 exe 실행, 프로세스 감지, 로컬 파일 경로 접근, 트레이 알림, 자동 업데이트를 담당하게 만들면 됩니다.

모바일 앱은 PWA를 먼저 유지하고, 네이티브 배포가 필요해지면 Capacitor로 알림, 파일 공유, 백그라운드 동기화를 붙이는 방향이 좋습니다.

웹에서는 보안 샌드박스 때문에 exe 직접 실행, 실행 중인 프로세스 감지, 임의 로컬 경로 접근이 불가능합니다. 그래서 현재 게임 허브는 URL 열기와 수동 상태 변경만 제공합니다.

## 알려진 한계

- 계정/친구/채팅은 같은 브라우저 안의 로컬 데이터입니다.
- JSON 내보내기는 앱 상태와 파일 메타데이터만 포함하며 IndexedDB Blob 원본은 포함하지 않습니다.
- 실시간 동기화, 푸시 알림, 권한/역할 강제는 서버 DB 연결 뒤 구현해야 합니다.
- PWA service worker는 Python 로컬 서버에서 정상 동작합니다. 파일을 직접 열면 브라우저 정책상 제한될 수 있습니다.
