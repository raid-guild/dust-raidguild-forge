export function AboutTab() {
  return (
    <div
      style={{
        backgroundColor: "#2a2a2a",
        padding: "30px",
        borderRadius: "12px",
        border: "2px solid #444",
        color: "#fff",
        maxWidth: "800px",
        margin: "0 auto",
        lineHeight: "1.6",
      }}
    >
      {/* Featured Image */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        <img
          src="/images/rg-forge-hall.png"
          alt="RaidGuild Forge Hall in DUST"
          style={{
            width: "100%",
            maxWidth: "600px",
            height: "auto",
            borderRadius: "8px",
            border: "2px solid #f53862",
            boxShadow: "0 4px 8px rgba(245, 56, 98, 0.3)",
          }}
        />
        <p
          style={{
            fontSize: "0.9rem",
            color: "#ccc",
            marginTop: "10px",
            fontStyle: "italic",
          }}
        >
          The RaidGuild Forge Hall in DUST
        </p>
      </div>

      {/* Disclaimer Section */}
      <div
        style={{
          backgroundColor: "#1a1a1a",
          padding: "20px",
          borderRadius: "8px",
          border: "2px solid #FF9800",
          marginBottom: "30px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            color: "#FF9800",
            fontSize: "1.8rem",
            marginBottom: "15px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          🧪 RaidGuild Forge (Experimental)
        </h2>
        <p style={{ fontSize: "1.1rem", marginBottom: "10px" }}>
          This is an experimental app built by RaidGuild.
        </p>
        <p style={{ fontSize: "1rem", color: "#ccc", marginBottom: "10px" }}>
          <strong>Source:</strong>{" "}
          <a
            href="https://github.com/raid-guild/dust-raidguild-forge"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#FF9800", textDecoration: "none" }}
          >
            github.com/raid-guild/dust-raidguild-forge
          </a>
        </p>
        <p style={{ fontSize: "1rem", color: "#4CAF50" }}>
          Feedback and contributions welcome!
        </p>
      </div>

      {/* What is the Forge Section */}
      <div style={{ marginBottom: "30px" }}>
        <h2
          style={{
            color: "#4CAF50",
            fontSize: "1.8rem",
            marginBottom: "15px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          🏗️ What is the Forge?
        </h2>
        <p style={{ fontSize: "1.2rem", marginBottom: "10px" }}>
          The RaidGuild Forge is a dev shop inside DUST.
        </p>
        <p style={{ fontSize: "1.1rem", color: "#ccc" }}>
          We build custom Smart Objects and Apps for Pesos (or tradeable
          resources).
        </p>
      </div>

      {/* About RaidGuild Section */}
      <div>
        <h2
          style={{
            color: "#9C27B0",
            fontSize: "1.8rem",
            marginBottom: "15px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          🧙 About RaidGuild
        </h2>
        <p style={{ fontSize: "1.2rem", marginBottom: "10px" }}>
          RaidGuild is a Web3-native dev collective.
        </p>
        <p style={{ fontSize: "1.1rem", marginBottom: "15px", color: "#ccc" }}>
          We launch chains, DAOs, and dApps — and onboard new builders via
          cohorts and irl events.
        </p>
        <p
          style={{
            fontSize: "1.2rem",
            color: "#f53862",
            fontWeight: "bold",
            textAlign: "center",
            marginTop: "20px",
            textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
          }}
        >
          Full-stack. DAO-native. Battle-tested.
        </p>
      </div>

      {/* Social Links Section */}
      <div
        style={{
          textAlign: "center",
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#1a1a1a",
          borderRadius: "8px",
        }}
      >
        <p style={{ fontSize: "1.1rem", marginBottom: "20px", color: "#ccc" }}>
          Connect with RaidGuild
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          {/* Website */}
          <a
            href="https://www.raidguild.org/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "45px",
              height: "45px",
              backgroundColor: "#f53862",
              borderRadius: "50%",
              textDecoration: "none",
              fontSize: "1.2rem",
              transition: "all 0.3s ease",
              border: "2px solid transparent",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "#f53862";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#f53862";
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.transform = "scale(1)";
            }}
            title="RaidGuild Website"
          >
            🌐
          </a>

          {/* Discord */}
          <a
            href="https://discord.gg/dRygQSSFk3"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "45px",
              height: "45px",
              backgroundColor: "#5865F2",
              borderRadius: "50%",
              textDecoration: "none",
              fontSize: "1.2rem",
              transition: "all 0.3s ease",
              border: "2px solid transparent",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "#5865F2";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#5865F2";
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.transform = "scale(1)";
            }}
            title="Join Discord"
          >
            💬
          </a>

          {/* Twitter/X */}
          <a
            href="https://x.com/RaidGuild"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "45px",
              height: "45px",
              backgroundColor: "#000000",
              borderRadius: "50%",
              textDecoration: "none",
              fontSize: "1.2rem",
              transition: "all 0.3s ease",
              border: "2px solid transparent",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "#000000";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#000000";
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.transform = "scale(1)";
            }}
            title="Follow on X/Twitter"
          >
            🐦
          </a>
        </div>
      </div>
    </div>
  );
}
