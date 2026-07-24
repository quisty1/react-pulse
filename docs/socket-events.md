# Socket.IO events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `workspace:join` / `workspace:leave` | client → server | room membership |
| `channel:join` / `channel:leave` | client → server | room membership |
| `conversation:join` / `conversation:leave` | client → server | room membership |
| `message:created` | server → client | new message |
| `message:updated` | server → client | edited message |
| `message:deleted` | server → client | deleted message |
| `reaction:added` / `reaction:removed` | server → client | reaction toggle |
| `typing:start` / `typing:stop` | both | typing indicators |
| `presence:update` | server → client | online/offline |
| `unread:update` | server → client | unread counters |
| `notification:created` | server → client | in-app notification |
| `error` | server → client | socket errors |
