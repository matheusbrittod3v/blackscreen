# Usamos o SDK do .NET 9 como base (ele já tem o compilador)
FROM mcr.microsoft.com/dotnet/sdk:9.0

# Instalar Node.js e ferramentas necessárias para o Painel
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs zip

WORKDIR /app

# Copia os arquivos do projeto
COPY . .

# Entra na pasta do painel e instala dependências
WORKDIR /app/admin-panel
RUN npm install

# Expõe a porta do painel
EXPOSE 3000

# Comando para rodar o painel
CMD ["node", "server.js"]
