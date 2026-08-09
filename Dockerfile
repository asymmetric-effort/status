FROM ubuntu:24.04 AS gpg-builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    bzip2 \
    zlib1g-dev \
    libbz2-dev \
    libsqlite3-dev \
    libreadline-dev \
    libldap2-dev \
    libnpth0-dev \
    texinfo \
    && rm -rf /var/lib/apt/lists/*

ENV PKG_CONFIG_PATH=/usr/local/lib/pkgconfig
ENV LD_LIBRARY_PATH=/usr/local/lib

# Build libgpg-error 1.56
RUN curl -sL https://gnupg.org/ftp/gcrypt/libgpg-error/libgpg-error-1.56.tar.bz2 -o /tmp/libgpg-error.tar.bz2 \
    && cd /tmp && tar xjf libgpg-error.tar.bz2 && cd libgpg-error-1.56 \
    && ./configure --prefix=/usr/local \
    && make -j$(nproc) \
    && make install \
    && ldconfig

# Build libgcrypt 1.11.0
RUN curl -sL https://gnupg.org/ftp/gcrypt/libgcrypt/libgcrypt-1.11.0.tar.bz2 -o /tmp/libgcrypt.tar.bz2 \
    && cd /tmp && tar xjf libgcrypt.tar.bz2 && cd libgcrypt-1.11.0 \
    && ./configure --prefix=/usr/local \
    && make -j$(nproc) \
    && make install \
    && ldconfig

# Build libksba 1.7.0
RUN curl -sL https://gnupg.org/ftp/gcrypt/libksba/libksba-1.7.0.tar.bz2 -o /tmp/libksba.tar.bz2 \
    && cd /tmp && tar xjf libksba.tar.bz2 && cd libksba-1.7.0 \
    && ./configure --prefix=/usr/local \
    && make -j$(nproc) \
    && make install \
    && ldconfig

# Build libassuan 3.0.2
RUN curl -sL https://gnupg.org/ftp/gcrypt/libassuan/libassuan-3.0.2.tar.bz2 -o /tmp/libassuan.tar.bz2 \
    && cd /tmp && tar xjf libassuan.tar.bz2 && cd libassuan-3.0.2 \
    && ./configure --prefix=/usr/local \
    && make -j$(nproc) \
    && make install \
    && ldconfig

# Build GnuPG 2.5.21
RUN curl -sL https://gnupg.org/ftp/gcrypt/gnupg/gnupg-2.5.21.tar.bz2 -o /tmp/gnupg.tar.bz2 \
    && cd /tmp && tar xjf gnupg.tar.bz2 && cd gnupg-2.5.21 \
    && ./configure --prefix=/usr/local \
    && make -j$(nproc) \
    && make install \
    && ldconfig

# Runtime image
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    jq \
    make \
    ca-certificates \
    pinentry-tty \
    && rm -rf /var/lib/apt/lists/*

# Copy all built libraries and binaries from builder
COPY --from=gpg-builder /usr/local/lib/ /usr/local/lib/
COPY --from=gpg-builder /usr/local/bin/ /usr/local/bin/
COPY --from=gpg-builder /usr/local/libexec/ /usr/local/libexec/

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
