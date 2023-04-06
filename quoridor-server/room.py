from fastapi import WebSocket

from typing import Dict


class Room :
    def __init__(self):
        self.id = None
        # which folder is this room's website on?
        self.folder = ""

        self.clients: Dict[str, WebSocket] = dict()

    # accept new connections
    async def connect(self, clientId, sock: WebSocket):
        print("connect")
        self.clients[clientId] = sock

    # remove clients that droped
    async def disconnect(self, clientId: str):
        print("disconnect")
        self.clients.pop(clientId, None)

    # interpret python struct as json and send to all clients 
    async def broadcast(self, data):
        print(f"start broadcast {len(self.clients.keys())}")
        for socket in self.clients.values():
            await socket.send_json(data)
            # s : WebSocket = None

    # receive messages from client (message processing in inherited classes)
    async def receive(self, clientId: str, data):
        #print(f"room receive {data}")
        pass

    def set_id(self, id):
        self.id = id



