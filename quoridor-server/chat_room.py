from room import Room
from fastapi import WebSocket

class ChatRoom (Room):
    def __init__(self):
        super().__init__()
        self.folder = "chat"
        self.numberClients = 0

    async def connect(self, clientId, sock: WebSocket):
        await super().connect(clientId, sock)

        await self.send(clientId, {"type":"message","message":f"you are #{self.numberClients} in the chat!"})
        self.numberClients += 1
        await self.broadcast({"type":"message","message":f"{clientId} has joined the chat"})

    async def disconnect(self, clientId: str):
        print("disconnect chat")
        await super().disconnect(clientId)
        print("disconnect chat 2")

        await self.broadcast({"type": "message","message":f"{clientId} has disconnected"})

    async def receive(self, clientId: str, data):
        await super().receive(clientId, data)

        print(data)
        data = {"type" : "message", "message": data}

        await self.broadcast(data)
