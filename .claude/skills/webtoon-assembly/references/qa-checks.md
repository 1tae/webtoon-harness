# QA 검증 명령 모음 (quality-reviewer 바로 쓰기)

객관 지표는 추정하지 말고 아래 명령으로 측정해 `qa_report.md`의 "측정 로그"에 출력째 붙인다.
`{NN}`은 2자리 회차 번호로 치환한다. 기준 루트는 `_workspace/`.

## 1. 패널 수 (50+ 충족)
```bash
EP=01; DIR="_workspace/05_panels/ep${EP}"
ls "$DIR"/panel_*.png 2>/dev/null | wc -l
```
판정: 50 이상 PASS, 미만 REDO(비트 분할 재작업 요청).

## 2. 0바이트 파일 색출
```bash
EP=01; DIR="_workspace/05_panels/ep${EP}"
find "$DIR" -name 'panel_*.png' -size 0 -print
```
출력이 있으면 해당 패널 재렌더 요청(panel-artist).

## 3. 손상 PNG 검사 (매직 바이트 + 디코딩)
```bash
EP=01; DIR="_workspace/05_panels/ep${EP}"
for f in "$DIR"/panel_*.png; do
  # PNG 시그니처 확인
  sig=$(head -c 8 "$f" | xxd -p)
  case "$sig" in
    89504e470d0a1a0a) ok=1 ;;
    *) echo "BAD-HEADER: $f" ;;
  esac
done
# 더 강한 검증(설치돼 있으면): 실제 디코딩 시도
command -v sips >/dev/null && for f in "$DIR"/panel_*.png; do \
  sips -g pixelWidth "$f" >/dev/null 2>&1 || echo "DECODE-FAIL: $f"; done
```
`pngcheck`가 있으면 `pngcheck -q "$DIR"/panel_*.png`가 가장 확실하다.

## 4. 번호 결손(빠진 패널) 검출
```bash
EP=01; DIR="_workspace/05_panels/ep${EP}"
N=$(ls "$DIR"/panel_*.png 2>/dev/null | wc -l | tr -d ' ')
for i in $(seq -f "%03g" 1 "$N"); do
  [ -f "$DIR/panel_${i}.png" ] || echo "MISSING: panel_${i}.png"
done
```
연속 번호가 비면 episode-compositor의 순서가 어긋날 수 있으므로 재렌더 요청.

## 5. 뷰어 무결성 (index.html이 패널을 다 참조하는지)
```bash
EP=01; H="_workspace/06_assembly/ep${EP}/index.html"
# PANELS 배열이 참조하는 패널 개수
grep -o 'panel_[0-9]\{3\}\.png' "$H" | sort -u | wc -l
```
참조 수와 실제 PNG 수가 일치하는지 대조한다.

## 6. md5 중복 검사 (서로 다른 패널이 동일 이미지)
```bash
EP=01; DIR="_workspace/05_panels/ep${EP}"
md5sum "$DIR"/panel_*.png 2>/dev/null | awk '{print $1}' | sort | uniq -d
```
출력이 있으면 해당 해시의 패널을 확인해 중복 패널을 삭제 후 단독 재렌더. (EP01 실제 발생)
`md5sum`이 없으면 `md5 -r`로 대체. 비어야 정상.

## 에러 핸들링 (검증 명령 실행 시)
- 명령 실패 시(디렉토리 없음, 권한 등): 오류 메시지를 qa_report.md 측정 로그에 남기고 대체 명령으로 재시도한다.
- `xxd`, `sips`, `pngcheck`, `md5sum` 등 도구가 없을 경우: "도구 미설치"를 기록하고 가용한 대안(예: `python3 -c "import hashlib..."`)으로 대체한다. 측정을 건너뛰지 않는다.
- 패널 디렉토리 자체가 없으면 "패널 디렉토리 누락"으로 REDO 판정하고 비주얼팀에 에스컬레이션한다.

## 판정 등급 요약
- PASS: 측정 통과. FIX: 국소 수정으로 해결(재렌더 불필요/경미). REDO: 재렌더·재집필 필요한 근본 결함.
- 항목별 측정값과 판정을 `qa_report.md`에 수치로 기록한다.
