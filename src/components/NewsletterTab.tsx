export const NewsletterTab = () => {
  return (
    <div>
      <div
        style={{
          backgroundColor: "#2a2a2a",
          padding: "20px 25px",
          borderRadius: "12px",
          marginBottom: "25px",
          border: "2px solid #FF9800",
          boxShadow: "0 4px 12px rgba(255,152,0,0.2)",
        }}
      >
        <h2
          style={{
            color: "#ffffff",
            fontSize: "1.8rem",
            fontWeight: "bold",
            margin: 0,
            textAlign: "center",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          📰 Daily DUST
        </h2>
      </div>
      <p style={{ color: "#888", marginBottom: "20px" }}>
        Weekly newsletter with the latest Dust updates and community highlights
      </p>

      <div
        style={{
          backgroundColor: "#2a2a2a",
          padding: "40px",
          borderRadius: "12px",
          marginBottom: "20px",
          border: "1px solid #FF9800",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>📰</div>
        <h3
          style={{
            color: "#ffffff",
            marginBottom: "15px",
            fontSize: "24px",
            fontWeight: "bold",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          Coming Soon!
        </h3>
        <p
          style={{
            color: "#ccc",
            fontSize: "16px",
            lineHeight: "1.6",
            maxWidth: "500px",
            margin: "0 auto",
          }}
        >
          The Daily Dust newsletter is currently in development. Stay tuned for
          weekly updates, community highlights, and the latest news from the
          Dust universe!
        </p>
      </div>
    </div>
  );
};
