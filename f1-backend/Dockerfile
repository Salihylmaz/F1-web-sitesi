# 1. AŞAMA: Çalışma Zamanı (Base/Runtime)
# Proje bittiğinde çalışacağı hafif ortamı ayarlıyoruz. (.NET 8 kullanıyoruz)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
# .NET 8 varsayılan olarak 8080 portunu kullanır
EXPOSE 8080 

# 2. AŞAMA: İnşa Etme (Build)
# Kodu derlemek için gereken ağır SDK imajını çekiyoruz
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Önce sadece proje dosyasını kopyalayıp gerekli kütüphaneleri (örn: Elasticsearch paketi) indiriyoruz
COPY ["f1-backend.csproj", "./"]
RUN dotnet restore "./f1-backend.csproj"

# Sonra tüm kodları kopyalayıp derleme işlemini başlatıyoruz
COPY . .
RUN dotnet build "f1-backend.csproj" -c Release -o /app/build

# 3. AŞAMA: Yayımlama (Publish)
# Derlenen projeyi yayına hazır, en optimize (Release) hale getiriyoruz
FROM build AS publish
RUN dotnet publish "f1-backend.csproj" -c Release -o /app/publish

# 4. AŞAMA: Final
# Publish edilen hazır dosyaları 1. Aşamadaki hafif ortama taşıyıp projeyi başlatıyoruz
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "f1-backend.dll"]