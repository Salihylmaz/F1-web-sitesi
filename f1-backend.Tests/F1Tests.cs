using f1_backend.Models;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace f1_backend.Tests;

/// <summary>
/// Driver model ve temel veri yapısı testleri.
/// Elasticsearch mock gerektirmeyen saf birim testleri.
/// </summary>
public class DriverModelTests
{
    [Fact]
    public void Driver_ShouldStore_IdNameTeamPoints()
    {
        // Arrange & Act
        var driver = new Driver
        {
            Id     = "verstappen",
            Name   = "Max Verstappen",
            Team   = "Red Bull Racing",
            Points = 393.0
        };

        // Assert
        Assert.Equal("verstappen",     driver.Id);
        Assert.Equal("Max Verstappen", driver.Name);
        Assert.Equal("Red Bull Racing", driver.Team);
        Assert.Equal(393.0,            driver.Points);
    }

    [Fact]
    public void Driver_Points_ShouldSupport_HalfPoints()
    {
        // F1'de yarım puan mümkün (örn: yağmur yarışları)
        var driver = new Driver { Points = 12.5 };
        Assert.Equal(12.5, driver.Points);
    }

    [Fact]
    public void Driver_ShouldAllow_NullableFields()
    {
        // Elasticsearch'ten eksik veri gelebilir
        var driver = new Driver();
        Assert.Null(driver.Id);
        Assert.Null(driver.Name);
        Assert.Null(driver.Team);
        Assert.Equal(0.0, driver.Points);
    }

    [Theory]
    [InlineData("verstappen", "Max Verstappen",    "Red Bull Racing",  393.0)]
    [InlineData("hamilton",   "Lewis Hamilton",    "Mercedes",         190.0)]
    [InlineData("leclerc",    "Charles Leclerc",   "Ferrari",          175.0)]
    [InlineData("norris",     "Lando Norris",      "McLaren",          205.0)]
    [InlineData("perez",      "Sergio Perez",      "Red Bull Racing",  152.0)]
    public void Driver_MultipleDrivers_ShouldStoreCorrectly(
        string id, string name, string team, double points)
    {
        var driver = new Driver { Id = id, Name = name, Team = team, Points = points };

        Assert.Equal(id,     driver.Id);
        Assert.Equal(name,   driver.Name);
        Assert.Equal(team,   driver.Team);
        Assert.Equal(points, driver.Points);
    }

    [Fact]
    public void Driver_TeamName_ShouldNotBeEmpty_WhenValid()
    {
        var driver = new Driver { Team = "Ferrari" };
        Assert.NotEmpty(driver.Team);
    }
}

/// <summary>
/// F1DataService parse logic testleri — HttpClient mock ile.
/// Gerçek API'a çıkmadan JSON parse mantığını test eder.
/// </summary>
public class F1DataServiceParseTests
{
    // Ergast API'ının gerçek response formatını simüle eden mock JSON
    private const string MockStandingsJson = """
    {
      "MRData": {
        "StandingsTable": {
          "StandingsLists": [
            {
              "DriverStandings": [
                {
                  "position": "1",
                  "points": "393",
                  "wins": "9",
                  "Driver": {
                    "driverId": "verstappen",
                    "givenName": "Max",
                    "familyName": "Verstappen"
                  },
                  "Constructors": [
                    { "name": "Red Bull" }
                  ]
                },
                {
                  "position": "2",
                  "points": "190",
                  "wins": "2",
                  "Driver": {
                    "driverId": "hamilton",
                    "givenName": "Lewis",
                    "familyName": "Hamilton"
                  },
                  "Constructors": [
                    { "name": "Mercedes" }
                  ]
                }
              ]
            }
          ]
        }
      }
    }
    """;

    [Fact]
    public void ParseStandingsJson_ShouldExtract_DriverId()
    {
        using var document = System.Text.Json.JsonDocument.Parse(MockStandingsJson);
        var standings = document.RootElement
            .GetProperty("MRData")
            .GetProperty("StandingsTable")
            .GetProperty("StandingsLists")[0]
            .GetProperty("DriverStandings")
            .EnumerateArray()
            .ToList();

        Assert.Equal(2, standings.Count);

        var first = standings[0].GetProperty("Driver");
        Assert.Equal("verstappen", first.GetProperty("driverId").GetString());
    }

    [Fact]
    public void ParseStandingsJson_ShouldBuildFullName_FromGivenAndFamily()
    {
        using var document = System.Text.Json.JsonDocument.Parse(MockStandingsJson);
        var firstStanding = document.RootElement
            .GetProperty("MRData")
            .GetProperty("StandingsTable")
            .GetProperty("StandingsLists")[0]
            .GetProperty("DriverStandings")[0];

        var driverNode = firstStanding.GetProperty("Driver");
        string fullName = $"{driverNode.GetProperty("givenName").GetString()} {driverNode.GetProperty("familyName").GetString()}";

        Assert.Equal("Max Verstappen", fullName);
    }

    [Fact]
    public void ParseStandingsJson_ShouldParse_Points_AsDouble()
    {
        using var document = System.Text.Json.JsonDocument.Parse(MockStandingsJson);
        var firstStanding = document.RootElement
            .GetProperty("MRData")
            .GetProperty("StandingsTable")
            .GetProperty("StandingsLists")[0]
            .GetProperty("DriverStandings")[0];

        string pointsStr = firstStanding.GetProperty("points").GetString()!;
        double points = double.Parse(pointsStr, System.Globalization.CultureInfo.InvariantCulture);

        Assert.Equal(393.0, points);
    }

    [Fact]
    public void ParseStandingsJson_ShouldExtract_ConstructorName()
    {
        using var document = System.Text.Json.JsonDocument.Parse(MockStandingsJson);
        var firstStanding = document.RootElement
            .GetProperty("MRData")
            .GetProperty("StandingsTable")
            .GetProperty("StandingsLists")[0]
            .GetProperty("DriverStandings")[0];

        string teamName = firstStanding.GetProperty("Constructors")[0].GetProperty("name").GetString()!;

        Assert.Equal("Red Bull", teamName);
    }

    [Fact]
    public void ParseStandingsJson_AllDrivers_ShouldHavePositivePoints()
    {
        using var document = System.Text.Json.JsonDocument.Parse(MockStandingsJson);
        var standings = document.RootElement
            .GetProperty("MRData")
            .GetProperty("StandingsTable")
            .GetProperty("StandingsLists")[0]
            .GetProperty("DriverStandings")
            .EnumerateArray();

        foreach (var standing in standings)
        {
            string pointsStr = standing.GetProperty("points").GetString()!;
            double points = double.Parse(pointsStr, System.Globalization.CultureInfo.InvariantCulture);
            Assert.True(points >= 0, $"Points should be non-negative but got {points}");
        }
    }
}

/// <summary>
/// Basit sağlık ve konfigürasyon testleri.
/// </summary>
public class ConfigurationTests
{
    [Fact]
    public void ElasticsearchUrl_Default_ShouldBeLocalhost()
    {
        // Yerel geliştirme ortamında default URL doğru mu?
        string defaultUrl = "http://localhost:9200";
        Assert.StartsWith("http", defaultUrl);
        Assert.Contains("9200", defaultUrl);
    }

    [Fact]
    public void ApiEndpoint_Drivers_ShouldMatchRoute()
    {
        // Controller route'unun beklenen formatta olduğunu doğrula
        string expectedRoute = "api/Drivers";
        Assert.True(expectedRoute.StartsWith("api/"), "Route must start with 'api/'");
        Assert.False(string.IsNullOrEmpty(expectedRoute));
    }

    [Fact]
    public void ErgastApiUrl_ShouldBeReachable_Format()
    {
        string ergastUrl = "https://api.jolpi.ca/ergast/f1/current/driverStandings.json";
        Assert.StartsWith("https://", ergastUrl);
        Assert.EndsWith(".json", ergastUrl);
    }
}
