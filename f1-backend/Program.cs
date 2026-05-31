using Elastic.Clients.Elasticsearch;
using f1_backend.Models;

var builder = WebApplication.CreateBuilder(args);

var elasticUrl = builder.Configuration["ELASTICSEARCH_URL"] ?? "http://localhost:9200";
var settings = new ElasticsearchClientSettings(new Uri(elasticUrl)).DefaultIndex("f1_drivers");
var elasticClient = new ElasticsearchClient(settings);
builder.Services.AddSingleton(elasticClient);

// Add services to the container.

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
            .AllowAnyHeader() 
            .AllowAnyMethod();
    });

});

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

app.UseAuthorization();

app.MapControllers();

app.Run();

