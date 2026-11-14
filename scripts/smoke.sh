#!/usr/bin/env bash
# Teste rápido de ponta a ponta contra um servidor rodando.
#   bash tests/smoke.sh                     # http://127.0.0.1:8000
#   bash tests/smoke.sh https://forplotr.jbrj.gov.br
# Usa os dados de exemplo do pacote (RUS01), então não precisa de planilha.
set -euo pipefail
BASE="${1:-http://127.0.0.1:8000}"

echo "== saúde"; curl -fsS "$BASE/v1/health"; echo

for tool in balance vouchers; do
  echo "== enviando $tool (exemplo RUS01)"
  resp=$(curl -fsS -X POST "$BASE/v1/jobs/$tool" \
    -F usar_exemplo=true -F input_type=field_sheet -F language=pt \
    -F render_html=true -F render_pdf=false -F write_xlsx=true)
  echo "$resp"
  id=$(echo "$resp" | sed -n 's/.*"job_id": *"\([^"]*\)".*/\1/p')
  [ -n "$id" ] || { echo "sem job_id"; exit 1; }

  for i in $(seq 1 180); do
    st=$(curl -fsS "$BASE/v1/jobs/$id")
    s=$(echo "$st" | sed -n 's/.*"status": *"\([a-z]*\)".*/\1/p' | head -1)
    printf '\r  %s (%ss)   ' "$s" "$((i*5))"
    if [ "$s" = "done" ] || [ "$s" = "error" ]; then break; fi
    sleep 5
  done
  echo
  if [ "$s" != "done" ]; then
    echo "FALHOU: $st"; echo "--- log"; curl -fsS "$BASE/v1/jobs/$id/log"; exit 1
  fi
  curl -fsS -o "/tmp/forplotr_${tool}.zip" "$BASE/v1/jobs/$id/files/all"
  echo "  OK: resultado em /tmp/forplotr_${tool}.zip ($(wc -c < "/tmp/forplotr_${tool}.zip") bytes)"
done
echo "== tudo certo"
