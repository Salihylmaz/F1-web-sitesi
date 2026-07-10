using Elastic.Clients.Elasticsearch;
using f1_backend.Models;
using Hangfire;
using System.Text.Json;

namespace f1_backend.Services
{
    public class F1DataService
    {
        private readonly ElasticsearchClient _elasticClient;
        private readonly HttpClient _httpClient;

        // Dependency Injection (Bağımlılık Enjeksiyonu) ile Elasticsearch'ü içeri alıyoruz
        public F1DataService(ElasticsearchClient elasticClient, HttpClient httpClient)
        {
            _elasticClient = elasticClient;
            _httpClient = httpClient;
        }

        // 1. GÖREV: Takvimi Çek ve Sıradaki Yarışa Alarm Kur
        public async Task ScheduleNextRaceJob()
        {
            try
            {
                // Ergast API'ından mevcut sezonun takvimini çekiyoruz
                var response = await _httpClient.GetStringAsync("https://api.jolpi.ca/ergast/f1/current.json");
                using var document = JsonDocument.Parse(response);

                var races = document.RootElement
                    .GetProperty("MRData")
                    .GetProperty("RaceTable")
                    .GetProperty("Races").EnumerateArray();

                DateTime now = DateTime.UtcNow;
                DateTime? nextRaceDate = null;

                // Gelecekteki ilk yarışı bul
                foreach (var race in races)
                {
                    string dateStr = race.GetProperty("date").GetString();
                    string timeStr = race.TryGetProperty("time", out var timeProp) ? timeProp.GetString() : "15:00:00Z";

                    DateTime raceDate = DateTime.Parse($"{dateStr}T{timeStr}").ToUniversalTime();

                    if (raceDate > now)
                    {
                        nextRaceDate = raceDate;
                        break; // Gelecekteki ilk yarışı bulduk, döngüden çık
                    }
                }

                if (nextRaceDate.HasValue)
                {
                    // Yarış saatine +3 saat ekleyerek alarmı kur
                    DateTime fetchTime = nextRaceDate.Value.AddHours(3);

                    // Hangfire'a görevi veriyoruz
                    BackgroundJob.Schedule<F1DataService>(
                        service => service.UpdateDriversStandings(),
                        fetchTime
                    );

                    Console.WriteLine($"[SİSTEM] Sonraki güncelleme şuna ayarlandı: {fetchTime} (UTC)");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[HATA] Takvim çekilirken hata oluştu: {ex.Message}");
            }
        }

        // 2. GÖREV: Alarm Çaldığında Çalışacak Asıl Güncelleme Metodu
        public async Task UpdateDriversStandings()
        {
            Console.WriteLine("[SİSTEM] Hangfire uyandı! Pilot verileri Ergast API'ından çekiliyor...");

            try
            {
                // 1. Ergast Canlı Puan Durumu API'ına İstek At
                var response = await _httpClient.GetStringAsync("https://api.jolpi.ca/ergast/f1/current/driverStandings.json");
                using var document = JsonDocument.Parse(response);

                // JSON Hiyerarşisindeki o derin diziye iniyoruz
                var standings = document.RootElement
                    .GetProperty("MRData")
                    .GetProperty("StandingsTable")
                    .GetProperty("StandingsLists")[0]
                    .GetProperty("DriverStandings").EnumerateArray();

                var driversList = new List<Driver>();

                // 2. JSON'ı C# Nesnelerine (List) Çevir
                foreach (var standing in standings)
                {
                    var driverNode = standing.GetProperty("Driver");
                    var constructorNode = standing.GetProperty("Constructors")[0]; // Pilotun ilk takımını al

                    var driver = new Driver
                    {
                        Id = driverNode.GetProperty("driverId").GetString(),
                        // givenName ve familyName'i birleştirip tam isim yapıyoruz
                        Name = $"{driverNode.GetProperty("givenName").GetString()} {driverNode.GetProperty("familyName").GetString()}",
                        Team = constructorNode.GetProperty("name").GetString(),
                        // API puanı string dönüyor, double'a parse ediyoruz (örn: "15" -> 15.0)
                        Points = double.Parse(standing.GetProperty("points").GetString(), System.Globalization.CultureInfo.InvariantCulture)
                    };

                    driversList.Add(driver);
                }

                Console.WriteLine($"[SİSTEM] Toplam {driversList.Count} pilot bulundu. Elasticsearch'e yazılıyor...");

                // 3. ELASTICSEARCH BULK UPSERT (Sektör Standardı Veritabanı Operasyonu)
                // "Eğer pilot (örn: alonso) veritabanında yoksa ekle, varsa sadece puanını/takımını güncelle"
                var bulkResponse = await _elasticClient.BulkAsync(b => b
                    .Index("f1_drivers")
                    .UpdateMany(driversList, (ud, d) => ud
                        .Id(d.Id)
                        .Doc(d)
                        .DocAsUpsert(true) // Sihirli kelime: Update or Insert (Upsert)
                    )
                );

                if (bulkResponse.IsValidResponse)
                {
                    Console.WriteLine("[BAŞARILI] Tüm pilot verileri Elasticsearch'e başarıyla eşitlendi!");
                }
                else
                {
                    Console.WriteLine($"[ELASTIC HATA] {bulkResponse.DebugInformation}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[HATA] Veriler güncellenirken bir sorun oluştu: {ex.Message}");
            }
            finally
            {
                // İşlem başarılı da olsa hata da alsa, bir sonraki yarışa alarm kurma zincirini kırma!
                BackgroundJob.Enqueue<F1DataService>(service => service.ScheduleNextRaceJob());
            }
        }
    }
}