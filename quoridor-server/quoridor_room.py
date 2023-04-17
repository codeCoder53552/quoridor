from room import Room
from game import QuoridorGame
from fastapi import WebSocket
import json
from types import SimpleNamespace

class QuoridorRoom (Room):
    def __init__(self, players=2):
        super().__init__()
        self.folder = "quoridor-client"
        self._type = "game"
        self.game = QuoridorGame()

    async def connect(self, clientId, sock: WebSocket):
        await super().connect(clientId, sock)

        playerNum = self.game.numOfActivePlayers

        if not self.game.gameOver:
            if self.game.add_player(clientId):
                pass
        else:
            await self.broadcast("Game is over. Please return home and start a new room to play.")

        result = self.game.prep_result(playerNum)
        dictionary = result.toDictionary()
        dictionary["playerNum"] = playerNum
        await self.send(clientId, dictionary)
            
    async def disconnect(self, clientId: str):
        print("disconnect chat")
        removeResult = self.game.remove_player(clientId)

        if removeResult:
            print(f"Player {removeResult} quit the game.")
            self.game.gameOver = True

        print(self.game.players)
        await super().disconnect(clientId)
        print("disconnect chat 2")

        await self.broadcast({"type": "message","message":f"{clientId} has disconnected"})

    async def receive(self, clientId: str, data):
        await super().receive(clientId, data)

        print(data)

        try:
            if data is not None and not self.game.gameOver:
                moveObject = json.loads(data, object_hook=lambda d: SimpleNamespace(**d))
                result = self.game.make_move(clientId, moveObject)
                if result.success:
                    await self.broadcast(result.toDictionary())
                else:
                    await self.send(clientId, result.toDictionary())
            else:
                await self.broadcast({"success" : False, "message" : "game is over."})
        except json.decoder.JSONDecodeError:
            await self.broadcast({"success": False, "message":"Data wasn't able to be decoded from JSON format."})






