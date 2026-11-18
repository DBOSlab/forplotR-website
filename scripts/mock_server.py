"""Servidor falso para testar o site sem R (só para desenvolvimento do frontend).

    quarto render
    python3 scripts/mock_server.py   ->  http://127.0.0.1:8000/

Imita o contrato da API (/v1/health, /v1/tools, /v1/jobs/...). Os jobs
"rodam" por alguns segundos e devolvem arquivos de mentira.
"""
import json, os, re, time, uuid, io, zipfile
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "_site")
PORT = int(os.environ.get("PORT", "8000"))
JOBS = {}

def o(**kw): return [{"value": k, "label": v} for k, v in kw.items()]
IT = o(field_sheet="ForestPlots — field sheet", field_sheet_ti="Field sheet de Terra Indígena",
       fp_query_sheet="ForestPlots — Query Library", monitora="MONITORA (ICMBio)")
FP = {"name": "fp_file", "label": "Planilha da parcela", "type": "file", "required": True,
      "accept_ext": ["xlsx", "xls"], "help": "Arquivo Excel no formato escolhido abaixo.", "group": "principal"}
EX = {"name": "usar_exemplo", "label": "Usar os dados de exemplo do pacote (RUS01 ou TUM)", "type": "example",
      "group": "principal", "help": "Para demonstração."}
def f(name, label, type, **kw):
    d = {"name": name, "label": label, "type": type, "group": "principal"}; d.update(kw); return d
MON = {"field": "input_type", "values": ["monitora"]}
TOOLS = [
  {"id": "balance", "fun": "forplot_balance", "chip": "Relatório", "title": "Relatório e balanço de coleta",
   "description": "Mapas da parcela e de cada subparcela, situação de coleta, checklist e planilha-resumo.",
   "eta": "1 a 5 minutos", "example": True,
   "fields": [FP, EX, f("input_type", "Formato da planilha", "select", options=IT, default="field_sheet"),
              f("language", "Idioma dos resultados", "select", options=o(pt="Português", en="English"), default="pt"),
              f("station_name", "Estação(ões) MONITORA", "text_vec", show_if=MON),
              f("plot_size", "Área da parcela (ha)", "number", default=1),
              f("subplot_size", "Lado da subparcela (m)", "number", default=10),
              f("render_html", "Gerar relatório HTML interativo", "bool", default=True),
              f("render_pdf", "Gerar relatório PDF", "bool", default=False, help="Exige LaTeX."),
              f("plot_name", "Nome da parcela", "text", group="avancado"),
              f("colname_tagno", "Coluna da plaqueta", "text", group="colunas")]},
  {"id": "map", "fun": "forplot_map", "chip": "Mapa", "title": "Mapa interativo da parcela",
   "description": "Mapa HTML sobre satélite com filtros e fotos.", "eta": "menos de 1 minuto", "example": True,
   "fields": [FP, EX, f("input_type", "Formato da planilha", "select", options=IT, default="field_sheet"),
              f("vertices", "Coordenadas da parcela (graus decimais)", "vertices", help="Uma linha por ponto.")]},
  {"id": "sheets", "fun": "forplot_sheets", "chip": "Herbário", "title": "Planilha para o herbário",
   "description": "Preenche a planilha do JABOT/BRAHMS.", "eta": "menos de 1 minuto", "example": True,
   "fields": [FP, EX, f("majorarea", "Estado", "text", required=True)]},
  {"id": "crossdet", "fun": "forplot_crossdet", "chip": "Determinações", "title": "Cruzamento com o herbário",
   "description": "Compara as identificações com o JABOT.", "eta": "alguns minutos", "example": True,
   "fields": [FP, EX, f("herbaria", "Herbário", "text", default="RB", required=True)]},
  {"id": "vouchers", "fun": "forplot_vouchers", "chip": "Vouchers", "title": "Pastas de vouchers",
   "description": "Cria a estrutura Família/Gênero/Voucher.", "eta": "segundos", "example": True,
   "fields": [FP, EX]},
]

FAKE_HTML = b"""<!doctype html><meta charset=utf-8><body style="font-family:sans-serif;padding:2rem">
<h1>Relat\xc3\xb3rio completo (simulado)</h1><p>Aqui entraria o HTML gerado pelo forplotR.</p></body>"""
PNG = open(os.path.join(ROOT, "figures", "forplotR_hex_sticker.png"), "rb").read()

def job_view(j):
    now = time.time(); age = now - j["created_epoch"]
    st = dict(j)
    if age < 2: st["status"] = "queued"; st["queue_position"] = 1
    elif age < 7: st.update(status="running", started_epoch=j["created_epoch"] + 2)
    else:
        st.update(status="error" if j["fail"] else "done", started_epoch=j["created_epoch"] + 2,
                  elapsed_s=5, message="Concluído", n_files=3, zip="resultados_x.zip")
        if j["fail"]: st["error"] = "Coluna 'T1' não encontrada (simulado)."
        st["files"] = [
          {"id": "f1", "path": "06Nov2026/parcela_relatorio_completo.html", "name": "r.html",
           "label": "Relatório completo (HTML interativo)", "kind": "html", "size": len(FAKE_HTML)},
          {"id": "f2", "path": "06Nov2026/parcela_geral.png", "name": "g.png",
           "label": "Mapa geral da parcela", "kind": "image", "size": len(PNG)},
          {"id": "f3", "path": "06Nov2026/parcela_balanco_coleta.xlsx", "name": "c.xlsx",
           "label": "Balanço de coleta por subparcela (XLSX)", "kind": "xlsx", "size": 20480}]
    return st

class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def send_json(self, obj, code=200):
        b = json.dumps(obj).encode(); self.send_response(code)
        self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(b)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        p = self.path.split("?")[0]
        if not p.startswith("/v1/"): return super().do_GET()
        if p == "/v1/health": return self.send_json({"status": "ok", "forplotR": "1.1.0 (simulado)", "R": "R 4.5.1",
                                                    "workers": 2, "queue": 0, "running": 0, "max_upload_mb": 200, "keep_hours": 72})
        if p == "/v1/tools": return self.send_json(TOOLS)
        m = re.match(r"^/v1/jobs/([0-9a-f-]{36})(/log|/files/(\w+))?$", p)
        if m and m.group(1) in JOBS:
            j = JOBS[m.group(1)]
            if m.group(2) == "/log":
                b = "Usando os dados de exemplo RUS01 do pacote.\nExecutando forplotR::forplot_balance() ...\nComputing plot coordinates...\nBuilding plot maps...".encode()
                self.send_response(200); self.send_header("Content-Type", "text/plain; charset=utf-8"); self.end_headers(); self.wfile.write(b); return
            if m.group(3):
                fid = m.group(3)
                body, ct = {"f1": (FAKE_HTML, "text/html"), "f2": (PNG, "image/png")}.get(fid, (b"x", "application/octet-stream"))
                self.send_response(200); self.send_header("Content-Type", ct); self.end_headers(); self.wfile.write(body); return
            return self.send_json(job_view(j))
        if m: return self.send_json({"status": "error", "message": "não encontrado"}, 404)
        self.send_error(404)
    def do_POST(self):
        m = re.match(r"^/v1/jobs/(\w+)$", self.path)
        n = int(self.headers.get("Content-Length", "0")); body = self.rfile.read(n)
        if not m: return self.send_error(404)
        tool = m.group(1); t = next((x for x in TOOLS if x["id"] == tool), None)
        jid = str(uuid.uuid4())
        JOBS[jid] = {"id": jid, "tool": tool, "title": t["title"], "fun": t["fun"], "created_epoch": time.time(),
                     "status": "queued", "message": "", "error": "", "files": [], "n_files": 0, "zip": "",
                     "forplotR": "1.1.0 (simulado)", "fail": b"name=\"usar_exemplo\"\r\n\r\ntrue" not in body}
        self.send_json({"job_id": jid, "status": "queued"}, 202)
    def do_OPTIONS(self):  # pré-verificação CORS (envio com barra de progresso)
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    def log_message(self, *a): pass

if __name__ == "__main__":
    print("http://127.0.0.1:%d/" % PORT)
    ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
