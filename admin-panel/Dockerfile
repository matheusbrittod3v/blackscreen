# Usamos Node para o Painel
FROM node:18

# Instalar SDK do .NET (Isso funciona no Linux, mas NÃO compila WPF para Windows)
RUN apt-get update && apt-get install -y dotnet-sdk-9.0

WORKDIR /app

# Copia arquivos do painel
COPY admin-panel/package*.json ./
RUN npm install

# Copia todo o projeto (para as fontes C# estarem disponíveis)
WORKDIR /src
COPY . .

# Volta para a pasta do painel
WORKDIR /src/admin-panel

EXPOSE 3000
CMD ["node", "server.js"]
