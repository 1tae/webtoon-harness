# PNG 무결성 검증 규칙

> **이 문서는 PNG를 생성·검증하는 모든 에이전트(panel-artist-a/b/c, ref-sheet-artist, panel-validator, quality-reviewer)가 공유하는 무결성 검증 규칙이다.**

## 검증 항목

### 1. 0바이트/손상 PNG
```bash
ls -la _workspace/05_panels/ep{NN}/*.png
file _workspace/05_panels/ep{NN}/*.png       # 모두 "PNG image data" 인지
find _workspace/05_panels/ep{NN} -name '*.png' -size 0    # 0바이트 목록
```
- codex 세션이 도구 호출에 실패하면 0바이트 PNG가 나올 수 있다.
- PNG 매직 바이트(`\x89PNG`)로 헤더를 확인한다.

### 2. md5 중복 검사 (필수 — EP01에서 실제 발생)
```bash
md5 -r _workspace/05_panels/ep{NN}/panel_*.png | awk '{print $1}' | sort | uniq -d
# 비면 중복 없음
```
- **서로 다른 패널이 동일 이미지로 저장되는 사고**가 동시 배치에서 드물게 발생한다(EP01 실제 발생).
- 0바이트도 손상도 아니어서 **크기/헤더 검사만으로는 못 잡는다** — md5 검사를 반드시 한다.

### 3. 누락 패널
- prompts 목록과 실제 PNG 목록을 대조해 빠진 번호를 찾는다.
- 파일이 `~/.codex/generated_images/`에만 있고 작업 폴더에 없으면 프롬프트의 "./경로로 저장" 지시를 강화해 재시도한다.

## 검증 결과 처리

| 상황 | 조치 |
|------|------|
| 0바이트/손상 PNG | 해당 패널만 재렌더(배치 전체 재실행 금지). 최대 2~3회 재시도. |
| md5 중복 PNG | 중복 패널 삭제 후 그 패널만 단독 재렌더. |
| 누락 패널 | prompts 목록 대조 후 빠진 번호만 렌더. |
| 반복 실패(2~3회) | 번호와 사유를 리더에 보고. 경고 후 통과시키고 보고서에 명시. |

## 적용 에이전트

- **panel-artist-a/b/c**: 렌더 직후 자기 그룹 PNG에 대해 1차 자기 검증 수행.
- **ref-sheet-artist**: 레퍼런스 시트 렌더 후 0바이트/손상/md5 중복 확인, 각도 간 동일인 여부 점검.
- **panel-validator**: C6(기술 무결성) 축에서 스크립트로 객관 측정.
- **quality-reviewer**: 조립 후 끝단 검수에서 패널 수·무결성·md5 중복 재확인.
