import { useQuery } from "@tanstack/react-query";

import { connectDustClient } from "dustkit/internal";
import { encodeBlock } from "@dust/world/internal";
import { useState, useEffect } from "react";

interface Waypoint {
  id: string;
  entityId: string;
  label: string;
  notes: string;
  category: string;
  createdAt: string;
}

export const WaypointsTab = () => {
  const dustClient = useQuery({
    queryKey: ["dust-client"],
    queryFn: connectDustClient,
  });

  // Waypoint state
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [newWaypoint, setNewWaypoint] = useState({
    entityId: "",
    label: "",
    notes: "",
    category: "General",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editingWaypoint, setEditingWaypoint] = useState<Waypoint | null>(null);

  // Position state
  const [playerPosition, setPlayerPosition] = useState<string>("");
  const [cursorPosition, setCursorPosition] = useState<string>("");
  const [playerPositionLoading, setPlayerPositionLoading] =
    useState<boolean>(false);
  const [cursorPositionLoading, setCursorPositionLoading] =
    useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error" | "info";
    id: string;
  } | null>(null);

  // Auto-hide feedback after 3 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Load waypoints from localStorage
  useEffect(() => {
    try {
      const savedWaypoints = localStorage.getItem("raidguild-waypoints");
      if (savedWaypoints) {
        const parsed = JSON.parse(savedWaypoints);
        console.log("📂 Loading waypoints from localStorage:", parsed.length);
        setWaypoints(parsed);
      } else {
        console.log(
          "📂 No saved waypoints found in localStorage, adding default Forge Hall waypoint"
        );
        // Add default RaidGuild Forge Hall waypoint
        const defaultWaypoint: Waypoint = {
          id: "default-forge-hall",
          entityId:
            "0x03000005040000009afffffc6100000000000000000000000000000000000000",
          label: "RaidGuild Forge Hall",
          notes:
            "The main RaidGuild Forge Hall - a central hub for crafting and community",
          category: "Base",
          createdAt: new Date().toISOString(),
        };
        setWaypoints([defaultWaypoint]);
        localStorage.setItem(
          "raidguild-waypoints",
          JSON.stringify([defaultWaypoint])
        );
      }
    } catch (error) {
      console.error("Error loading waypoints:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save waypoints to localStorage
  useEffect(() => {
    // Only save after initial load to prevent overwriting with empty array
    if (isLoaded) {
      try {
        localStorage.setItem("raidguild-waypoints", JSON.stringify(waypoints));
        console.log("💾 Waypoints saved to localStorage:", waypoints.length);
      } catch (error) {
        console.error("Error saving waypoints:", error);
      }
    }
  }, [waypoints, isLoaded]);

  const showFeedback = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    const id = Date.now().toString();
    setFeedback({ message, type, id });
  };

  // Add new waypoint
  const addWaypoint = () => {
    if (!newWaypoint.entityId.trim() || !newWaypoint.label.trim()) {
      showFeedback("Please enter both Entity ID and Label!", "error");
      return;
    }

    const waypoint: Waypoint = {
      id: Date.now().toString(),
      entityId: newWaypoint.entityId.trim(),
      label: newWaypoint.label.trim(),
      notes: newWaypoint.notes.trim(),
      category: newWaypoint.category,
      createdAt: new Date().toISOString(),
    };

    setWaypoints((prev) => [...prev, waypoint]);
    setNewWaypoint({ entityId: "", label: "", notes: "", category: "General" });
    showFeedback(`Waypoint "${waypoint.label}" added successfully!`, "success");
    console.log("Added waypoint:", waypoint);
  };

  // Set waypoint in game from waypoint object
  const activateWaypoint = async (waypoint: Waypoint) => {
    try {
      const success = await setWaypointInGame(
        waypoint.entityId,
        waypoint.label
      );
      if (success) {
        console.log(`✅ Waypoint set in game: ${waypoint.label}`);
        showFeedback(
          `Waypoint "${waypoint.label}" has been set in the game!`,
          "success"
        );
      } else {
        showFeedback(
          `Failed to set waypoint "${waypoint.label}" in the game.`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error setting waypoint in game:", error);
      showFeedback(
        `Error setting waypoint: ${error instanceof Error ? error.message : String(error)}`,
        "error"
      );
    }
  };

  // Set waypoint in game
  const setWaypointInGame = async (entityId: string, label: string) => {
    try {
      await dustClient.data?.provider.request({
        method: "setWaypoint",
        params: {
          entity: entityId as `0x${string}`,
          label,
        },
      });
      console.log(`✅ Waypoint set: ${label}`);
      return true;
    } catch (error) {
      console.error("Error setting waypoint:", error);
      return false;
    }
  };

  // Edit waypoint
  const saveEditedWaypoint = () => {
    if (!editingWaypoint) return;

    setWaypoints((prev) =>
      prev.map((wp) => (wp.id === editingWaypoint.id ? editingWaypoint : wp))
    );
    setEditingWaypoint(null);
  };

  // Delete waypoint
  const deleteWaypoint = (id: string) => {
    if (confirm("Are you sure you want to delete this waypoint?")) {
      setWaypoints((prev) => prev.filter((wp) => wp.id !== id));
    }
  };

  // Clear all waypoints
  const clearAllWaypoints = () => {
    if (
      confirm(
        "Are you sure you want to clear all waypoints? This cannot be undone."
      )
    ) {
      setWaypoints([]);
    }
  };

  const importWaypoints = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedWaypoints = JSON.parse(content);

        // Validate the imported data
        if (!Array.isArray(importedWaypoints)) {
          alert("Invalid file format. Expected an array of waypoints.");
          return;
        }

        // Validate each waypoint has required fields
        const validWaypoints = importedWaypoints.filter(
          (wp: any) => wp.entityId && wp.label && wp.category && wp.createdAt
        );

        if (validWaypoints.length !== importedWaypoints.length) {
          alert(
            `Warning: ${importedWaypoints.length - validWaypoints.length} waypoints were skipped due to invalid format.`
          );
        }

        if (validWaypoints.length === 0) {
          alert("No valid waypoints found in the file.");
          return;
        }

        // Add imported waypoints to existing ones
        setWaypoints((prev) => [...prev, ...validWaypoints]);
        alert(`Successfully imported ${validWaypoints.length} waypoints!`);

        // Clear the file input
        event.target.value = "";
      } catch (error) {
        console.error("Error importing waypoints:", error);
        alert("Error importing waypoints. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  const exportWaypoints = () => {
    const dataStr = JSON.stringify(waypoints, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `raidguild-waypoints-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  // DEPRECATED: Old implementation using explorer API - kept for reference
  /*
  

  // Helper function to get entity at position with fallback to terrain
  const getEntityAtPositionWithFallback = async (
    x: number,
    y: number,
    z: number
  ) => {
    console.log(`🔍 Looking for entity at position: ${x}, ${y}, ${z}`);

    // First, try to find a placed entity at this position
    const placedEntityQuery = `SELECT "entityId" FROM "EntityPosition" WHERE "x" = '${x}' AND "y" = '${y}' AND "z" = '${z}' LIMIT 1`;

    const placedEntityResponse = await fetch(
      "https://indexer.mud.redstonechain.com/q",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            query: placedEntityQuery,
            address: "0x253eb85B3C953bFE3827CC14a151262482E7189C",
          },
        ]),
      }
    );

    if (placedEntityResponse.ok) {
      const placedEntityData = (await placedEntityResponse.json()) as any;
      const placedEntityResult = Array.isArray(placedEntityData)
        ? placedEntityData[0]
        : placedEntityData;

      if (
        placedEntityResult.result &&
        placedEntityResult.result.length > 0 &&
        placedEntityResult.result[0] &&
        placedEntityResult.result[0].length > 1
      ) {
        const headers = placedEntityResult.result[0][0];
        const dataRow = placedEntityResult.result[0][1];
        const entityIdIndex = headers.findIndex(
          (header: string) => header === "entityId"
        );

        if (entityIdIndex !== -1 && dataRow[entityIdIndex]) {
          const entityId = dataRow[entityIdIndex];
          console.log("🎯 Found placed entity:", entityId);
          return { entityId, type: "placed" };
        }
      }
    }

    // If no placed entity found, try to get the terrain block entity ID
    // According to Dust docs, we need to encode the block position
    console.log("🏔️ No placed entity found, checking terrain...");

    // Create properly encoded entity ID for terrain blocks
    // Format: 0x03 + 4 bytes x + 4 bytes y + 4 bytes z + 8 bytes padding
    // Handle negative coordinates by using two's complement
    const encodeCoord = (coord: number): string => {
      if (coord >= 0) {
        return coord.toString(16).padStart(8, "0");
      } else {
        // For negative numbers, use two's complement (32-bit)
        const positive = Math.abs(coord);
        const complement = (0x100000000 - positive)
          .toString(16)
          .padStart(8, "0");
        return complement;
      }
    };

    // The working example has exactly 32 hex chars after 0x03: 8+8+8+8 = 32 chars
    const terrainEntityId = `0x03${encodeCoord(x)}${encodeCoord(y)}${encodeCoord(z)}00000000000000000000000000000000000000`;
    console.log(`🔧 Generated terrain entity ID: ${terrainEntityId}`);
    console.log(
      `🔧 Coordinates: x=${x} (${encodeCoord(x)}), y=${y} (${encodeCoord(y)}), z=${z} (${encodeCoord(z)})`
    );

    // Query EntityObjectType to see if this terrain block has been modified
    const terrainQuery = `SELECT "objectType" FROM "EntityObjectType" WHERE "entityId" = '${terrainEntityId}' LIMIT 1`;

    const terrainResponse = await fetch(
      "https://indexer.mud.redstonechain.com/q",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            query: terrainQuery,
            address: "0x253eb85B3C953bFE3827CC14a151262482E7189C",
          },
        ]),
      }
    );

    if (terrainResponse.ok) {
      const terrainData = (await terrainResponse.json()) as any;
      const terrainResult = Array.isArray(terrainData)
        ? terrainData[0]
        : terrainData;

      if (
        terrainResult.result &&
        terrainResult.result.length > 0 &&
        terrainResult.result[0] &&
        terrainResult.result[0].length > 1
      ) {
        const headers = terrainResult.result[0][0];
        const dataRow = terrainResult.result[0][1];
        const objectTypeIndex = headers.findIndex(
          (header: string) => header === "objectType"
        );

        if (objectTypeIndex !== -1 && dataRow[objectTypeIndex]) {
          const objectType = dataRow[objectTypeIndex];
          console.log(
            "🏔️ Found modified terrain block:",
            terrainEntityId,
            "with object type:",
            objectType
          );
          return { entityId: terrainEntityId, type: "terrain" };
        }
      }
    }

    // If we get here, it's likely natural terrain (grass, stone, etc.)
    console.log("🏔️ Found natural terrain block");
    return { entityId: terrainEntityId, type: "natural" };
  };
    */

  // NEW: Simple function that uses encodeBlock utility only
  const getEntityAtPositionWithEncodeBlock = (x: number, y: number, z: number) => {
    console.log(`🔍 Getting entity at position using encodeBlock: ${x}, ${y}, ${z}`);
    
    // Use encodeBlock utility to encode the block position into entity ID
    const entityId = encodeBlock([x, y, z]);
    console.log(`🔧 Generated entity ID using encodeBlock: ${entityId}`);
    console.log(`🔧 Coordinates: x=${x}, y=${y}, z=${z}`);
    
    return { entityId, type: "block" };
  };



  const getPlayerPositionEntity = async () => {
    setPlayerPositionLoading(true);
    setPlayerPosition("");
    try {
      const result = await dustClient.data?.provider.request({
        method: "getPlayerPosition",
        params: {
          entity:
            "0x0000000000000000000000000000000000000000000000000000000000000000", // Current player
        },
      });

      if (result) {
        const { x, y, z } = result;
        console.log(`✅ Player position: ${x}, ${y}, ${z}`);

        // Round coordinates to integers for MUD query (quadrant system - round to next block for negatives)
        const roundedX = x < 0 ? Math.floor(x) : Math.round(x);
        const roundedY = y < 0 ? Math.floor(y) - 1 : Math.round(y) - 1; // -1 to account for the fact that the player is in the block below the cursor
        const roundedZ = z < 0 ? Math.floor(z) : Math.round(z);
        console.log(
          `✅ Rounded position: ${roundedX}, ${roundedY}, ${roundedZ}`
        );

        // Use the new fallback function
        const { entityId, type } = await getEntityAtPositionWithEncodeBlock(
          roundedX,
          roundedY,
          roundedZ
        );

        setPlayerPosition(`${entityId} (${type})`);
        setNewWaypoint((prev) => ({ ...prev, entityId }));
        console.log(
          `✅ Found entity at player position: ${entityId} (${type})`
        );
      }
    } catch (error) {
      console.error("❌ Error getting player position:", error);
      setPlayerPosition("Error getting position");
    } finally {
      setPlayerPositionLoading(false);
    }
  };

  const getCursorPositionEntity = async () => {
    setCursorPositionLoading(true);
    setCursorPosition("");
    try {
      const result = await dustClient.data?.provider.request({
        method: "getCursorPosition",
        params: {},
      });

      if (
        result &&
        typeof result === "object" &&
        "x" in result &&
        "y" in result &&
        "z" in result
      ) {
        const { x, y, z } = result as { x: number; y: number; z: number };
        console.log(`✅ Cursor position: ${x}, ${y}, ${z}`);

        // Round coordinates to integers for MUD query (quadrant system - round to next block for negatives)
        const roundedX = x < 0 ? Math.floor(x) : Math.round(x);
        const roundedY = y < 0 ? Math.floor(y) : Math.round(y);
        const roundedZ = z < 0 ? Math.floor(z) : Math.round(z);
        console.log(
          `✅ Rounded cursor position: ${roundedX}, ${roundedY}, ${roundedZ}`
        );

        // Use the new fallback function
        const { entityId, type } = await getEntityAtPositionWithEncodeBlock(
          roundedX,
          roundedY,
          roundedZ
        );

        setCursorPosition(`${entityId} (${type})`);
        setNewWaypoint((prev) => ({ ...prev, entityId }));
        console.log(
          `✅ Found entity at cursor position: ${entityId} (${type})`
        );
      }
    } catch (error) {
      console.error("❌ Error getting cursor position:", error);
      setCursorPosition("Error getting position");
    } finally {
      setCursorPositionLoading(false);
    }
  };

  // Get categories for filtering
  const getCategories = () => {
    const categories = [...new Set(waypoints.map((wp) => wp.category))];
    return ["All", ...categories];
  };

  // Filter waypoints
  const filteredWaypoints = waypoints.filter((waypoint) => {
    const matchesSearch =
      waypoint.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      waypoint.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      waypoint.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || waypoint.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get category color
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      General: "#666",
      Friend: "#00BCD4",
      Mining: "#795548",
      Resources: "#2196F3",
      "Safe Zone": "#4CAF50",
      "Danger Zone": "#f44336",
      Base: "#9C27B0",
      Trading: "#FF9800",
      "Force Field": "#E91E63",
      Spawn: "#607D8B",
      Custom: "#607D8B",
    };
    return colors[category] || "#666";
  };

  // Copy entity ID to clipboard
  const copyEntityId = (entityId: string) => {
    navigator.clipboard.writeText(entityId);
    alert("Entity ID copied to clipboard!");
  };

  return (
    <div>
      <div
        style={{
          backgroundColor: "#2a2a2a",
          padding: "20px 25px",
          borderRadius: "12px",
          marginBottom: "25px",
          border: "2px solid #4CAF50",
          boxShadow: "0 4px 12px rgba(76,175,80,0.2)",
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
          📍 Waypoint Manager
        </h2>
      </div>

      {/* Feedback Display */}
      {feedback && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor:
              feedback.type === "success"
                ? "#4CAF50"
                : feedback.type === "error"
                  ? "#f44336"
                  : "#2196F3",
            color: "white",
            padding: "20px 30px",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            zIndex: 1000,
            maxWidth: "400px",
            textAlign: "center",
            fontSize: "16px",
            fontWeight: "500",
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* Add New Waypoint */}
      <div
        style={{
          backgroundColor: "#2a2a2a",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "25px",
          border: "1px solid #9C27B0",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            color: "#ffffff",
            marginBottom: "20px",
            fontSize: "20px",
            fontWeight: "bold",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            borderBottom: "2px solid #9C27B0",
            paddingBottom: "5px",
          }}
        >
          ➕ Add New Waypoint
        </h3>

        {/* Quick Position Tools */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative" }}>
            <button
              onClick={getCursorPositionEntity}
              disabled={cursorPositionLoading}
              title="Get entity ID at cursor position"
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: cursorPositionLoading ? "#666" : "#2196F3",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: cursorPositionLoading ? "not-allowed" : "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                boxShadow: cursorPositionLoading
                  ? "none"
                  : "0 2px 4px rgba(33, 150, 243, 0.3)",
              }}
            >
              {cursorPositionLoading ? "⏳" : "🖱️"}
            </button>
          </div>

          <div style={{ position: "relative" }}>
            <button
              onClick={getPlayerPositionEntity}
              disabled={playerPositionLoading}
              title="Get entity ID at block below player position"
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: playerPositionLoading ? "#666" : "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: playerPositionLoading ? "not-allowed" : "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                boxShadow: playerPositionLoading
                  ? "none"
                  : "0 2px 4px rgba(76, 175, 80, 0.3)",
              }}
            >
              {playerPositionLoading ? "⏳" : "🎯"}
            </button>
          </div>

          <span style={{ color: "#ccc", fontSize: "13px", marginLeft: "10px" }}>
            Quick tools: Click to auto-fill entity ID
          </span>
        </div>

        {/* Position Results */}
        {(playerPosition || cursorPosition) && (
          <div
            style={{
              backgroundColor: "#2a2a2a",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "13px",
              color: "#ccc",
              border: "1px solid #4CAF50",
            }}
          >
            {playerPosition && (
              <p style={{ marginBottom: "8px" }}>
                <strong>🎯 Player Position:</strong>{" "}
                <code
                  style={{
                    backgroundColor: "#1a1a1a",
                    color: "#ffffff",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  {playerPosition}
                </code>
              </p>
            )}
            {cursorPosition && (
              <p style={{ marginBottom: "8px" }}>
                <strong>🖱️ Cursor Position:</strong>{" "}
                <code
                  style={{
                    backgroundColor: "#1a1a1a",
                    color: "#ffffff",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  {cursorPosition}
                </code>
              </p>
            )}
            <p
              style={{
                color: "#4CAF50",
                fontSize: "12px",
                margin: 0,
                fontWeight: "500",
              }}
            >
              ✅ Entity ID automatically added to form below!
            </p>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
            marginBottom: "15px",
          }}
        >
          <input
            type="text"
            placeholder="Entity ID (required) - e.g., 0x1234..."
            value={newWaypoint.entityId}
            onChange={(e) =>
              setNewWaypoint((prev) => ({
                ...prev,
                entityId: e.target.value,
              }))
            }
            style={{
              gridColumn: "1 / -1",
              padding: "12px",
              backgroundColor: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px",
            }}
          />
          <input
            type="text"
            placeholder="Label (required) - e.g., My Base"
            value={newWaypoint.label}
            onChange={(e) =>
              setNewWaypoint((prev) => ({ ...prev, label: e.target.value }))
            }
            style={{
              padding: "12px",
              backgroundColor: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px",
            }}
          />
          <select
            value={newWaypoint.category}
            onChange={(e) =>
              setNewWaypoint((prev) => ({
                ...prev,
                category: e.target.value,
              }))
            }
            style={{
              padding: "12px",
              backgroundColor: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px",
            }}
          >
            <option value="General">General</option>
            <option value="Friend">👥 Friend</option>
            <option value="Mining">Mining</option>
            <option value="Resources">Resources</option>
            <option value="Safe Zone">Safe Zone</option>
            <option value="Danger Zone">Danger Zone</option>
            <option value="Base">Base</option>
            <option value="Trading">Trading</option>
            <option value="Force Field">Force Field</option>
            <option value="Spawn">Spawn</option>
            <option value="Custom">Custom</option>
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={addWaypoint}
              style={{
                padding: "12px 20px",
                backgroundColor: "#9C27B0",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 4px rgba(156, 39, 176, 0.3)",
              }}
            >
              📍 Add Waypoint
            </button>
            {feedback && feedback.message.includes("added successfully") && (
              <span
                style={{
                  fontSize: "14px",
                  color: "#4CAF50",
                  fontWeight: "500",
                }}
              >
                ✅ Added!
              </span>
            )}
          </div>
        </div>

        <textarea
          placeholder="Notes (optional) - What's at this location? Any important details?"
          value={newWaypoint.notes}
          onChange={(e) =>
            setNewWaypoint((prev) => ({ ...prev, notes: e.target.value }))
          }
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "12px",
            backgroundColor: "#2a2a2a",
            border: "1px solid #444",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "14px",
            resize: "vertical",
          }}
        />
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "15px",
          marginBottom: "25px",
          alignItems: "center",
          backgroundColor: "#1a1a1a",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #607D8B",
        }}
      >
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="🔍 Search waypoints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "14px",
            }}
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: "12px",
            backgroundColor: "#2a2a2a",
            border: "1px solid #444",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "14px",
            minWidth: "150px",
          }}
        >
          {getCategories().map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <div
          style={{
            backgroundColor: "#2a2a2a",
            padding: "12px 16px",
            borderRadius: "8px",
            color: "#ccc",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          📊 {filteredWaypoints.length} of {waypoints.length} waypoints
        </div>
      </div>

      {/* Waypoints Table */}
      <div
        style={{
          backgroundColor: "#1a1a1a",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #444",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#2a2a2a" }}>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                📍 Set Waypoint
              </th>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                🏷️ Label
              </th>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                📂 Category
              </th>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                🆔 Entity ID
              </th>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                📝 Notes
              </th>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                📅 Created
              </th>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  borderBottom: "1px solid #444",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                ⚙️ Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredWaypoints.map((waypoint) => (
              <tr
                key={waypoint.id}
                style={{
                  borderBottom: "1px solid #333",
                  backgroundColor: "#2a2a2a",
                  transition: "background-color 0.2s ease",
                }}
              >
                <td style={{ padding: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={() => activateWaypoint(waypoint)}
                      style={{
                        padding: "8px 16px",
                        fontSize: "13px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 4px rgba(76, 175, 80, 0.3)",
                      }}
                      title="Set this waypoint in the game"
                    >
                      📍 Set Waypoint
                    </button>
                    {feedback && feedback.message.includes(waypoint.label) && (
                      <span
                        style={{
                          fontSize: "12px",
                          color:
                            feedback.type === "success" ? "#4CAF50" : "#f44336",
                          fontWeight: "500",
                        }}
                      >
                        {feedback.type === "success" ? "✅" : "❌"}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: "16px" }}>
                  {editingWaypoint?.id === waypoint.id ? (
                    <input
                      type="text"
                      value={editingWaypoint.label}
                      onChange={(e) =>
                        setEditingWaypoint((prev) =>
                          prev ? { ...prev, label: e.target.value } : null
                        )
                      }
                      style={{
                        padding: "8px",
                        width: "100%",
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #444",
                        borderRadius: "4px",
                        color: "#fff",
                        fontSize: "14px",
                      }}
                    />
                  ) : (
                    <strong style={{ color: "#fff", fontSize: "14px" }}>
                      {waypoint.label}
                    </strong>
                  )}
                </td>
                <td style={{ padding: "16px" }}>
                  {editingWaypoint?.id === waypoint.id ? (
                    <select
                      value={editingWaypoint.category}
                      onChange={(e) =>
                        setEditingWaypoint((prev) =>
                          prev ? { ...prev, category: e.target.value } : null
                        )
                      }
                      style={{
                        padding: "8px",
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #444",
                        borderRadius: "4px",
                        color: "#fff",
                        fontSize: "14px",
                      }}
                    >
                      <option value="General">General</option>
                      <option value="Friend">👥 Friend</option>
                      <option value="Mining">Mining</option>
                      <option value="Resources">Resources</option>
                      <option value="Safe Zone">Safe Zone</option>
                      <option value="Danger Zone">Danger Zone</option>
                      <option value="Base">Base</option>
                      <option value="Trading">Trading</option>
                      <option value="Force Field">Force Field</option>
                      <option value="Spawn">Spawn</option>
                      <option value="Custom">Custom</option>
                    </select>
                  ) : (
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontSize: "12px",
                        backgroundColor: getCategoryColor(waypoint.category),
                        color: "white",
                        fontWeight: "500",
                      }}
                    >
                      {waypoint.category}
                    </span>
                  )}
                </td>
                <td
                  style={{
                    padding: "16px",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    color: "#ccc",
                  }}
                >
                  <code
                    style={{
                      backgroundColor: "#1a1a1a",
                      padding: "4px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {waypoint.entityId.substring(0, 10)}...
                  </code>
                  <button
                    onClick={() => copyEntityId(waypoint.entityId)}
                    style={{
                      marginLeft: "8px",
                      padding: "4px 8px",
                      fontSize: "12px",
                      backgroundColor: "#607D8B",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    title="Copy Entity ID"
                  >
                    📋
                  </button>
                </td>
                <td
                  style={{
                    padding: "16px",
                    fontSize: "14px",
                    color: "#ccc",
                  }}
                >
                  {editingWaypoint?.id === waypoint.id ? (
                    <textarea
                      value={editingWaypoint.notes}
                      onChange={(e) =>
                        setEditingWaypoint((prev) =>
                          prev ? { ...prev, notes: e.target.value } : null
                        )
                      }
                      style={{
                        padding: "8px",
                        width: "100%",
                        minHeight: "60px",
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #444",
                        borderRadius: "4px",
                        color: "#fff",
                        fontSize: "14px",
                        resize: "vertical",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "13px" }}>
                      {waypoint.notes || (
                        <span style={{ color: "#666", fontStyle: "italic" }}>
                          No notes
                        </span>
                      )}
                    </span>
                  )}
                </td>
                <td
                  style={{
                    padding: "16px",
                    fontSize: "13px",
                    color: "#888",
                  }}
                >
                  {new Date(waypoint.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: "16px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {editingWaypoint?.id === waypoint.id ? (
                      <>
                        <button
                          onClick={saveEditedWaypoint}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            backgroundColor: "#4CAF50",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "500",
                            transition: "all 0.2s ease",
                          }}
                        >
                          ✅ Save
                        </button>
                        <button
                          onClick={() => setEditingWaypoint(null)}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            backgroundColor: "#666",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "500",
                            transition: "all 0.2s ease",
                          }}
                        >
                          ❌ Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingWaypoint(waypoint)}
                          style={{
                            padding: "6px 10px",
                            fontSize: "12px",
                            backgroundColor: "#2196F3",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          title="Edit waypoint"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteWaypoint(waypoint.id)}
                          style={{
                            padding: "6px 10px",
                            fontSize: "12px",
                            backgroundColor: "#f44336",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          title="Delete waypoint"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredWaypoints.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 40px",
            color: "#888",
            backgroundColor: "#1a1a1a",
            borderRadius: "12px",
            border: "1px solid #444",
            marginBottom: "25px",
          }}
        >
          {waypoints.length === 0 ? (
            <div>
              <div style={{ fontSize: "48px", marginBottom: "20px" }}>📍</div>
              <h3
                style={{
                  color: "#666",
                  marginBottom: "10px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                No waypoints yet
              </h3>
              <p style={{ fontSize: "14px" }}>
                Add your first waypoint using the form above!
              </p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: "48px", marginBottom: "20px" }}>🔍</div>
              <h3
                style={{
                  color: "#666",
                  marginBottom: "10px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                No matches found
              </h3>
              <p style={{ fontSize: "14px" }}>
                Try adjusting your search criteria or category filter.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div
        style={{
          marginTop: "25px",
          textAlign: "center",
          backgroundColor: "#2a2a2a",
          padding: "25px",
          borderRadius: "12px",
          border: "1px solid #607D8B",
        }}
      >
        <h3
          style={{
            color: "#ffffff",
            marginBottom: "20px",
            fontSize: "20px",
            fontWeight: "bold",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            borderBottom: "2px solid #607D8B",
            paddingBottom: "5px",
          }}
        >
          ⚙️ Quick Actions
        </h3>
        <div
          style={{
            display: "flex",
            gap: "15px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={clearAllWaypoints}
            style={{
              padding: "12px 20px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(244, 67, 54, 0.3)",
            }}
          >
            🗑️ Clear All Waypoints
          </button>
          <button
            onClick={exportWaypoints}
            style={{
              padding: "12px 20px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 4px rgba(76, 175, 80, 0.3)",
            }}
          >
            📤 Export Waypoints
          </button>
          <label
            style={{
              padding: "8px 16px",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              display: "inline-block",
            }}
          >
            📥 Import Waypoints
            <input
              type="file"
              accept=".json"
              onChange={importWaypoints}
              style={{ display: "none" }}
            />
          </label>
        </div>

        <div
          style={{
            backgroundColor: "#1a1a1a",
            padding: "10px",
            borderRadius: "4px",
            fontSize: "12px",
            color: "#888",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <p>
            <strong>💡 Import/Export Tips:</strong>
          </p>
          <p>
            • <strong>Export:</strong> Downloads all your waypoints as a JSON
            file with today's date
          </p>
          <p>
            • <strong>Import:</strong> Select a JSON file to add waypoints to
            your existing collection
          </p>
          <p>
            • <strong>Share:</strong> Export your waypoints and share the file
            with friends!
          </p>
          <p>
            • <strong>Backup:</strong> Export regularly to backup your waypoint
            collection
          </p>
        </div>
      </div>
    </div>
  );
};
