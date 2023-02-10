from fastapi.responses import HTMLResponse
import uvicorn

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import HTMLResponse

from typing import List, Union, Dict

from starlette.responses import FileResponse

import os
import sys

import uuid

from room import Room
from room_factory import RoomFactory

app = FastAPI()

basePath = "."

rooms: Dict[str, Room] = dict()


# get main page
@app.get("/")
async def read_root():
    print("main")
    return FileResponse(os.path.join(basePath, "static", "index.html"))


# get resources under the main page
@app.get("/{item}")
def get_resource(item):
    print(f"get {item}")
    return FileResponse(os.path.join(basePath, "static", item))


# forward to webpage for specific room
@app.get("/room/{roomId}/{item}")
def load_room(roomId: str, item: str):
    print(f"get {roomId}/{item}")
    global rooms
    room: Room = rooms.get(roomId, None)

    if room is None:
        raise HTTPException(status_code=500, detail="invalid room")

    return FileResponse(os.path.join(basePath, "static", room.folder, item))    


# initialize new room
@app.get("/make_room/{roomType}")
def make_room(roomType: str):
    global rooms
    room: Room = RoomFactory().make_room(roomType)

    if room is None:
        raise HTTPException(status_code=500, detail="invalid room type")

    # keep track of running rooms
    rooms[room.id] = room

    # give roomid to player
    return room.id


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []


    async def connect(self, websocket: WebSocket, roomId: str, clientId: str):
        global rooms
        self.active_connections.append(websocket)

        room: Room = rooms.get(roomId, None)

        # room does not exist, close socket
        if room is None:
            print(rooms)
            # websocket.close(code=500, reason="room does not exist")
            return

        # connect client to correct room
        await room.connect(clientId, websocket)


    async def disconnect(self, websocket: WebSocket, roomId: str, clientId: str):
        global rooms
        self.active_connections.remove(websocket)

        room: Room = rooms.get(roomId, None)

        print("manager disconnect")
        print(rooms, roomId, room)

        if room is None:
            return

        await room.disconnect(clientId)


    async def receive(self, websocket: WebSocket, roomId: str, clientId: str, data):
        print("manager receive")
        global rooms

        room: Room = rooms.get(roomId, None)

        # room does not exist, close socket
        if room is None:
            # await websocket.close(code=500, reason="room does not exist")
            return

        print("manager receive 2")

        await room.receive(clientId, data)


    # async def send_personal_message(self, message: str, websocket: WebSocket):
    #     await websocket.send_text(message)


    # async def broadcast(self, message: str):
    #     for connection in self.active_connections:
    #         await connection.send_text(message)

manager = ConnectionManager()


@app.websocket("/ws/{roomId}")
async def websocket_endpoint(websocket: WebSocket, roomId: str, clientId: Union[str, None] = None):
    # print(room)
    try:
        await websocket.accept()

        # assign client a new id
        if clientId == None:
            clientId = str(uuid.uuid1())
            data = {
                "type" : "client_id",
                "client_id" : clientId
            }
            await websocket.send_json(data)

        # tracks new socket and adds to room
        await manager.connect(websocket, roomId, clientId)

        while True:
            data = await websocket.receive_text()
            print("socket receive")
            await manager.receive(websocket, roomId, clientId, data)
    except WebSocketDisconnect:
        print("socket disconnect")
        await manager.disconnect(websocket, roomId, clientId)



if __name__ == "__main__":
    uvicorn.run(app=app, host="0.0.0.0", port=8082)
