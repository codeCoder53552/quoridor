from room import Room
from game import QuoridorGame
from fastapi import WebSocket

class QuoridorRoom (Room):
    def __init__(self):
        super().__init__()
        self.folder = "quoridor-client"
        self.game = QuoridorGame()

    async def connect(self, clientId, sock: WebSocket):
        await super().connect(clientId, sock)

        if not self.game.gameOver:

            if self.game.add_player(clientId):
                pass
        else:
            print("Game is over. Please return home and start a new room to play.")

        print(self.game.players)
        await self.broadcast({"type":"message","message":f"{clientId} has joined the chat"})

    async def disconnect(self, clientId: str):
        print("disconnect chat")
        removeResult = self.game.remove_player(clientId)

        if removeResult:
            print(f"Player {removeResult} quit the game.")
            self.game.game_over()

        print(self.game.players)
        await super().disconnect(clientId)
        print("disconnect chat 2")

        await self.broadcast({"type": "message","message":f"{clientId} has disconnected"})

    async def receive(self, clientId: str, data):
        await super().receive(clientId, data)

        print(data)
        data = {"type" : "message", "message": data}

        await self.broadcast(data)






