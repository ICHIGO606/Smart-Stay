/**
 * Server-Sent Events (SSE) Manager for Live Room and Inventory Streaming
 * Zero-dependency native HTTP streaming for real-time front-desk sync.
 */
class SSEService {
  constructor() {
    this.hotelClients = new Map(); // hotelId -> Set<res>
  }

  /**
   * Register a new client listening to live updates for a hotel
   */
  registerClient(hotelId, res) {
    const key = String(hotelId);
    if (!this.hotelClients.has(key)) {
      this.hotelClients.set(key, new Set());
    }

    const clientSet = this.hotelClients.get(key);
    clientSet.add(res);

    // Keep connection alive with periodic heartbeats
    const heartbeatTimer = setInterval(() => {
      try {
        res.write(`: heartbeat ${Date.now()}\n\n`);
      } catch {
        clearInterval(heartbeatTimer);
      }
    }, 25000);

    // Cleanup on disconnect
    res.on("close", () => {
      clearInterval(heartbeatTimer);
      clientSet.delete(res);
      if (clientSet.size === 0) {
        this.hotelClients.delete(key);
      }
    });

    // Send initial greeting
    res.write(
      `event: connected\ndata: ${JSON.stringify({ connected: true, hotelId, timestamp: new Date() })}\n\n`,
    );
  }

  /**
   * Broadcast an event to all front-desk/admin clients watching this property
   */
  broadcast(hotelId, eventName, data) {
    const key = String(hotelId);
    const clientSet = this.hotelClients.get(key);
    if (!clientSet || clientSet.size === 0) return;

    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;

    clientSet.forEach((client) => {
      try {
        client.write(payload);
      } catch (err) {
        console.error("SSE write error:", err);
      }
    });
  }
}

export const sseService = new SSEService();
export default sseService;
