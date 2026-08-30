# 1. AŞAMA: Runtime base
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# 2. AŞAMA: Build
# Build context repo kökü olduğu için f1-backend/ prefix'i kullanıyoruz
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Önce sadece .csproj kopyalayıp restore et (layer cache için)
COPY ["f1-backend/f1-backend.csproj", "f1-backend/"]
RUN dotnet restore "f1-backend/f1-backend.csproj"

# Tüm backend kodunu kopyala
COPY f1-backend/ f1-backend/
WORKDIR "/src/f1-backend"
RUN dotnet build "f1-backend.csproj" -c Release -o /app/build

# 3. AŞAMA: Publish
FROM build AS publish
RUN dotnet publish "f1-backend.csproj" -c Release -o /app/publish

# 4. AŞAMA: Final image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "f1-backend.dll"]