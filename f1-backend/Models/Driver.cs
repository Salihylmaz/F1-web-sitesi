namespace f1_backend.Models
{
    public class Driver
    {
        public string Id { get; set; }     // Artık "alonso" gibi metinler gelecek
        public string Name { get; set; }
        public string Team { get; set; }
        public double Points { get; set; } // Yarım puan ihtimaline karşı double

    }
}
