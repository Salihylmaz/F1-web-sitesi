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
            var response = await _elasticClient.SearchAsync<Driver>();

            if (!response.IsValidResponse)
            {
                _logger.LogError("Elasticsearch'ten veri çekilirken hata oluştu: {Error.Detail}", response.DebugInformation);

                return StatusCode(StatusCodes.Status500InternalServerError, "Veritabanına ulaşılamadı veya bir hata oluştu");
            }

            return Ok(response.Documents);
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

        //post atıyorum burada da
        [HttpPost]
        public async Task<ActionResult> AddDriver([FromBody] Driver newDriver)
        {
            //veriyi elasticsearch'e yolla
            var response = await _elasticClient.IndexAsync(newDriver);

            if (response.IsValidResponse)
            {
                _logger.LogError("Yeni sürücü eklendi: {DriverName}", newDriver.Name);
                return Ok("Sürücü başarıyla eklendi");

            }
            _logger.LogError("Sürücü eklenirken Elasticsearch reddetti: {ErrorDetail}", response.DebugInformation);

            return BadRequest($"Sürücü eklenemedi. Elasticsearch Hatası: {response.DebugInformation}");
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateDriver(int id, [FromBody] Driver updatedDriver)
        {
            updatedDriver.Id = id;

            // Hangi Index ("f1_drivers") ve hangi ID (id.ToString()) güncellenecek açıkça belirtiyoruz
            var response = await _elasticClient.UpdateAsync<Driver, Driver>("f1_drivers", id.ToString(), u => u.Doc(updatedDriver));
            if (response.IsValidResponse)
            {
                _logger.LogInformation("Sürücü başarıyla güncellendi. ID: {DriverId}", id);
                return Ok("Sürücü başarıyla güncellendi");
            }

            _logger.LogError("Sürücü güncellenirken hata oluştu. {ErrorDetail}", response.DebugInformation);
            return BadRequest("Sürücü güncellenirken sistemsel bir hata oluştu");
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteDriver(int id)
        {
            // Modeli belirtmeden, doğrudan "Şu tablodaki, şu ID'li veriyi sil" emrini veriyoruz
            var response = await _elasticClient.DeleteAsync(new DeleteRequest("f1_drivers", id.ToString()));
            
            if (response.IsValidResponse)
            {
                _logger.LogInformation("Sürücü başarıyla silindi. ID: {DriverId}", id);
                return Ok("Sürücü başarıyla silindi.");
            }

            _logger.LogError("Sürücü silinirken hata oluştu veya bulunamadı: {ErrorDetail}", response.DebugInformation);
            // Veri bulunamadığında 404 dönmek en iyi pratiktir
            return NotFound("Silinmek istenen sürücü bulunamadı.");
        }
    }
}
