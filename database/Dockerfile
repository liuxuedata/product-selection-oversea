FROM postgres:14
ENV POSTGRES_DB=appdb
ENV POSTGRES_USER=appuser
ENV POSTGRES_PASSWORD=secret
COPY init.sql /docker-entrypoint-initdb.d/
