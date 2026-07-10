using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.QueryDsl;
using f1_backend.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace f1_backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DriversController : ControllerBase
    {
        private readonly ElasticsearchClient _elasticClient;
        private readonly ILogger<DriversController> _logger;

        public DriversController(ElasticsearchClient elasticClient, ILogger<DriversController> logger)
        {
            _elasticClient = elasticClient;
            _logger = logger;
        }


        // GET: api/Drivers yapıyorum burada. ELasticSearchten çekerek. ilerde llm eklersem kolay olur ayrıca
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Driver>>> GetDrivers()
        {
            try
            {
                var response = await _elasticClient.SearchAsync<Driver>(s => s
                    .Index("f1_drivers")
                    .Size(100)
                    .IgnoreUnavailable(true) // ZIRH: Eğer index henüz oluşturulmadıysa çökme, boş liste dön!
                );

                if (!response.IsValidResponse && response.ElasticsearchServerError != null)
                {
                    return StatusCode(500, $"Elasticsearch Hatası: {response.DebugInformation}");
                }

                // Eğer index yoksa null gelebilir, o yüzden boş liste dönüyoruz
                return Ok(response.Documents ?? new List<Driver>());
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[HATA] Veriler güncellenirken bir sorun oluştu: {ex.Message}");
                throw; 
            }
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Driver>>> SearchDrivers([FromQuery] string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                return Ok(new List<Driver>());
            }

            var searchResponse = await _elasticClient.SearchAsync<Driver>(s => s
                .Query(q => q
                    .MultiMatch(m => m
                        .Fields(new[] { "name", "team" })
                        .Query(searchTerm)
                        // Arama tipini "PhrasePrefix" yaparak eksik yazılan kelimelerin sonunu tamamlamasını sağlıyoruz.
                        .Type(TextQueryType.PhrasePrefix)
                    )
                )
            );

            if (!searchResponse.IsValidResponse)
            {
                return StatusCode(500, "Arama motoru servisinde bir problem oluştu.");
            }

            return Ok(searchResponse.Documents);
        }



    }
}
