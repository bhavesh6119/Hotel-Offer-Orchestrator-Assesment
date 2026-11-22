FROM debian:bookworm-slim

ARG TEMPORAL_CLI_VERSION=1.1.2

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL \
    "https://github.com/temporalio/cli/releases/download/v${TEMPORAL_CLI_VERSION}/temporal_cli_${TEMPORAL_CLI_VERSION}_linux_amd64.tar.gz" \
    | tar -xz -C /usr/local/bin temporal \
    && chmod +x /usr/local/bin/temporal

EXPOSE 7233 8233

ENTRYPOINT ["temporal"]
CMD ["server", "start-dev", \
     "--ip", "0.0.0.0", \
     "--port", "7233", \
     "--ui-ip", "0.0.0.0", \
     "--ui-port", "8233", \
     "--namespace", "default"]
