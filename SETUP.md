# APEPE Meme AI Studio — 셋업 가이드 (새 PC용)

이 폴더는 지금까지 작업한 전체 코드입니다. 새 PC에서 아래 순서대로 하면 실행됩니다.

## 0. 사전 준비

- Node.js 설치 (https://nodejs.org — LTS 버전)
- 설치 확인: 터미널(PowerShell)에서 `node -v` 입력 → 버전 나오면 OK

## 1. 폴더 위치

압축 풀어서 원하는 곳에 두세요. 예시:
```
C:\develop\apepe-meme-ai-studio
```

## 2. 패키지 설치

PowerShell에서:
```powershell
cd C:\develop\apepe-meme-ai-studio
npm install
```
(2~3분 소요. "2 vulnerabilities" 경고는 무시. `npm audit fix --force`는 실행하지 말 것.)

## 3. 환경변수 설정

`.env.example` 파일을 복사해서 `.env.local` 만들기:
```powershell
copy .env.example .env.local
notepad .env.local
```

메모장에서 Google AI API 키 입력 (한 줄, 따옴표/공백 없이):
```
GOOGLE_AI_API_KEY=AIza로_시작하는_본인_키
```
저장 후 닫기.

API 키 발급: https://aistudio.google.com/apikey
→ "Create API key" → 복사
→ Google Cloud Console에서 "Generative Language API" 활성화 필수
   (https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com)

## 4. APEPE 레퍼런스 이미지 넣기

`public/references/apepe/` 폴더에 시그니처 일러스트를 넣으세요:
- 파일명: `apepe-00.png` (정렬상 맨 앞이어야 메인 레퍼런스로 사용됨)

## 5. 실행

```powershell
npm run dev
```

브라우저에서:
- 랜딩 페이지: http://localhost:3000
- 스튜디오: http://localhost:3000/studio

## 6. 코드 수정 후 반영

파일 수정 후 저장하면 보통 자동 반영됨.
환경변수(.env.local) 변경 시에는 서버 재시작 필요:
- 터미널에서 Ctrl + C → `npm run dev`

---

## 현재 적용된 기능

- AI 이미지 생성 (Nano Banana Pro 모델)
- 한글 입력 → 영어 자동 번역
- 이미지 내 텍스트 생성 차단 (no text)
- "APEPE AI" 워터마크 우측 하단 자동 삽입
- 캐릭터 시그니처 고정 (빨간 눈, 눈두덩이, 머리 항상 가림), 표정·자세·배경 자유 변형
- 카운트다운 타이머 + 생성 장수 선택 (1/2/4장)
- 이미지 모달 확대 + 다운로드
- 랜딩 페이지 (코인명 제거, Soon 슬롯)

## 다음 작업 (TODO)

- 히어로 캐릭터 이미지 삽입: `public/hero-characters.png` 넣고 src/app/page.tsx의 주석 처리된 img 태그 활성화
- 캐릭터 일관성 추가 개선 (필요 시 Flux LoRA 학습 검토)
- GitHub push → Vercel 배포 → studio.apepe.lol 연결
