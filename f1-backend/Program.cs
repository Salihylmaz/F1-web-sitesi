using Elastic.Clients.Elasticsearch;
using Hangfire;
using Hangfire.InMemory;
using f1_backend.Services;

var builder = WebApplication.CreateBuilder(args);

var elasticUrl = builder.Configuration["ELASTICSEARCH_URL"] ?? "http://localhost:9200";
var settings = new ElasticsearchClientSettings(new Uri(elasticUrl)).DefaultIndex("f1_drivers");
var elasticClient = new ElasticsearchClient(settings);
builder.Services.AddSingleton(elasticClient);

builder.Services.AddHttpClient();
builder.Services.AddTransient<F1DataService>();

builder.Services.AddHangfire(configuration => configuration
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseInMemoryStorage());

builder.Services.AddHangfireServer();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            origin.Contains("localhost") ||
            origin.EndsWith(".vercel.app")
        )
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseAuthorization();
app.MapControllers();

app.UseHangfireDashboard();

BackgroundJob.Enqueue<F1DataService>(service => service.ScheduleNextRaceJob());

app.Run();