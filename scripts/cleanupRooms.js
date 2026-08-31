/**
 * ===================================================================
 * COUNTLESS - AUTOMATED STALE ROOM CLEANUP WORKER (scripts/cleanupRooms.js)
 * ===================================================================
 * Educational Notes for Mike & James:
 * 1. Ephemeral Data Lifecycle: Deletes game rooms that have been inactive for > 6 hours.
 * 2. Firebase REST API: Uses HTTP GET and DELETE requests directly without external SDKs.
 * 3. Midnight Protection: Compares against `lastUpdated` / `createdAt` timestamps so active
 *    games (even played past midnight) are never interrupted!
 */

const DATABASE_URL = "https://countless-game-default-rtdb.europe-west1.firebasedatabase.app";
const INACTIVITY_THRESHOLD_HOURS = 6; // 6 hours of complete inactivity
const CUTOFF_MS = INACTIVITY_THRESHOLD_HOURS * 60 * 60 * 1000;

async function cleanupStaleRooms() {
    console.log("==========================================");
    console.log("COUNTLESS: Starting Stale Room Cleanup Job");
    console.log(`Current Time: ${new Date().toISOString()}`);
    console.log(`Inactivity Threshold: ${INACTIVITY_THRESHOLD_HOURS} hours`);
    console.log("==========================================");

    try {
        const res = await fetch(`${DATABASE_URL}/rooms.json`);
        if (!res.ok) {
            throw new Error(`Failed to fetch rooms: ${res.status} ${res.statusText}`);
        }

        const rooms = await res.json();
        if (!rooms || Object.keys(rooms).length === 0) {
            console.log("No rooms found in database. Nothing to clean.");
            return;
        }

        const now = Date.now();
        const cutoffTime = now - CUTOFF_MS;
        let deletedCount = 0;
        let keptCount = 0;

        for (const [roomCode, roomData] of Object.entries(rooms)) {
            if (!roomData) continue;

            // Determine the most recent activity timestamp in the room
            const lastActivity = roomData.lastUpdated || roomData.createdAt || 0;
            const idleHours = ((now - lastActivity) / (1000 * 60 * 60)).toFixed(1);

            if (lastActivity < cutoffTime) {
                console.log(`🗑️ PURGING: Room [${roomCode}] (Host: "${roomData.hostName || 'Unknown'}", Idle: ${idleHours}h ago)`);
                
                const deleteRes = await fetch(`${DATABASE_URL}/rooms/${encodeURIComponent(roomCode)}.json`, {
                    method: "DELETE"
                });

                if (deleteRes.ok) {
                    deletedCount++;
                } else {
                    console.error(`❌ Failed to delete room [${roomCode}]: ${deleteRes.status} ${deleteRes.statusText}`);
                }
            } else {
                console.log(`✅ KEEPING: Room [${roomCode}] (Host: "${roomData.hostName || 'Unknown'}", Active: ${idleHours}h ago)`);
                keptCount++;
            }
        }

        console.log("==========================================");
        console.log(`Cleanup complete! Purged: ${deletedCount} | Kept Active: ${keptCount}`);
        console.log("==========================================");
    } catch (err) {
        console.error("Fatal error during cleanup:", err);
        process.exit(1);
    }
}

cleanupStaleRooms();
