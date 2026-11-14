# forplotR online — imagem para o servidor do JBRJ
# Construir (a partir da raiz do projeto):
#   docker compose build
#
# O site (_site/, gerado pelo `quarto render`) NÃO entra na imagem: o
# docker-compose monta a pasta, então basta renderizar de novo para atualizar.
#
# Versão do forplotR:
#  - se backend/pkg/ tiver o código do pacote (com DESCRIPTION), instala ele;
#  - senão instala do GitHub na referência FORPLOTR_REF (tag ou branch).

FROM rocker/geospatial:4.5.1

ENV LANG=C.UTF-8 LC_ALL=C.UTF-8 TZ=America/Sao_Paulo \
    FORPLOTR_ROOT=/srv/forplotr FORPLOTR_DATA_DIR=/data \
    HOST=0.0.0.0 PORT=8000

# Pacotes do servidor (o rocker/geospatial já traz terra, GDAL, pandoc e TinyTeX)
RUN install2.r --error --skipinstalled \
      plumber callr processx jsonlite zip webutils uuid openxlsx writexl \
      pkgload remotes

# forplotR
ARG FORPLOTR_REF=main
COPY backend/pkg/ /tmp/forplotR-pkg/
RUN if [ -f /tmp/forplotR-pkg/DESCRIPTION ]; then \
      Rscript -e "remotes::install_deps('/tmp/forplotR-pkg', upgrade = 'never')" && \
      R CMD INSTALL /tmp/forplotR-pkg ; \
    else \
      Rscript -e "remotes::install_github('DBOSlab/forplotR', ref = Sys.getenv('FORPLOTR_REF'), upgrade = 'never')" ; \
    fi && rm -rf /tmp/forplotR-pkg

# Pacotes LaTeX usados pelos relatórios PDF (inclui Mandarim). Instalados aqui
# porque, em produção, o TinyTeX não deve baixar nada durante um relatório.
RUN Rscript -e "try(tinytex::tlmgr_install(c('ctex','xecjk','fandol','fancyhdr','titlesec','float','booktabs','caption','tocloft','xcolor','hyperref','geometry')))" || true

# Usuário sem privilégios
RUN useradd -m -u 10001 forplotr && mkdir -p /data && chown -R forplotr /data

WORKDIR /srv/forplotr
COPY backend/ backend/
RUN mkdir -p _site && rm -rf backend/pkg

USER forplotr
EXPOSE 8000
CMD ["Rscript", "backend/run_api.R"]
