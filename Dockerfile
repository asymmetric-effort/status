FROM ubuntu:24.04 AS gpg-builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    bzip2 \
    libgpg-error-dev \
    libgcrypt-dev \
    libksba-dev \
    libnpth0-dev \
    zlib1g-dev \
    libbz2-dev \
    libsqlite3-dev \
    libreadline-dev \
    libldap2-dev \
    texinfo \
    && rm -rf /var/lib/apt/lists/*

# Build libassuan 3.0.2 (Ubuntu 24.04 ships 2.x, GnuPG 2.5.20 needs 3.x)
RUN curl -sL https://gnupg.org/ftp/gcrypt/libassuan/libassuan-3.0.2.tar.bz2 -o /tmp/libassuan.tar.bz2 \
    && cd /tmp && tar xjf libassuan.tar.bz2 && cd libassuan-3.0.2 \
    && ./configure --prefix=/usr/local \
    && make -j$(nproc) \
    && make install \
    && ldconfig

# Build GnuPG 2.5.20
ENV PKG_CONFIG_PATH=/usr/local/lib/pkgconfig
ENV LD_LIBRARY_PATH=/usr/local/lib
RUN curl -sL https://gnupg.org/ftp/gcrypt/gnupg/gnupg-2.5.21.tar.bz2 -o /tmp/gnupg.tar.bz2 \
    && cd /tmp && tar xjf gnupg.tar.bz2 && cd gnupg-2.5.21 \
    && ./configure --prefix=/usr/local \
    && make -j$(nproc) \
    && make install \
    && ldconfig

# Runtime image
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Install runtime deps — use apt to find correct package names for Noble
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    jq \
    ca-certificates \
    pinentry-tty \
    && rm -rf /var/lib/apt/lists/*

# Copy built libassuan, GnuPG, and their runtime deps from builder
COPY --from=gpg-builder /usr/local/lib/libassuan* /usr/local/lib/
COPY --from=gpg-builder /usr/local/bin/gpg /usr/local/bin/gpg
COPY --from=gpg-builder /usr/local/bin/gpg-agent /usr/local/bin/gpg-agent
COPY --from=gpg-builder /usr/local/bin/gpgconf /usr/local/bin/gpgconf
COPY --from=gpg-builder /usr/local/bin/gpgsm /usr/local/bin/gpgsm
COPY --from=gpg-builder /usr/local/bin/kbxutil /usr/local/bin/kbxutil
COPY --from=gpg-builder /usr/local/libexec/ /usr/local/libexec/

# Copy runtime shared libs that GPG needs from the builder
COPY --from=gpg-builder /usr/lib/x86_64-linux-gnu/libgpg-error.so* /usr/lib/x86_64-linux-gnu/
COPY --from=gpg-builder /usr/lib/x86_64-linux-gnu/libgcrypt.so* /usr/lib/x86_64-linux-gnu/
COPY --from=gpg-builder /usr/lib/x86_64-linux-gnu/libksba.so* /usr/lib/x86_64-linux-gnu/
COPY --from=gpg-builder /usr/lib/x86_64-linux-gnu/libnpth.so* /usr/lib/x86_64-linux-gnu/

RUN ldconfig

# Install Node.js 24
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Verify
RUN gpg --version | head -1 && node --version && gh --version | head -1

WORKDIR /workspace
