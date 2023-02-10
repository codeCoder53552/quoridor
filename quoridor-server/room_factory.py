from room import Room
from chat_room import ChatRoom
import uuid
from enum import Enum

from typing import Union

class RoomTypes:
    chat = "chat"
    game = "game"

class RoomFactory:
    # roomFactory = None
    def __init__(self) -> None:
        pass

    # def get_instance(self) -> RoomFactory:
    #     if RoomFactory.roomFactory is None:
    #         RoomFactory.roomFactory = RoomFactory()

    def make_room(self, type):
        newRoom: Room = None

        # initiate correct room type
        if type == RoomTypes.chat:
            newRoom = ChatRoom()
        else:
            return None

        # give random roomid
        # newRoom.set_id(str(uuid.uuid1()))
        newRoom.set_id("hello_world")

        return newRoom
