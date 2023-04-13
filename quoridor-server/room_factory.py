from room import Room
from chat_room import ChatRoom
from quoridor_room import QuoridorRoom
import uuid
from enum import Enum

from typing import Union

class RoomTypes:
    chat = "chat"
    game = "game"

class RoomFactory:
    # increasing index
    number = 0
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
        elif type == RoomTypes.game:
            newRoom = QuoridorRoom()
        else:
            return None

        # give random roomid
        # newRoom.set_id(str(uuid.uuid1()))
        newRoom.set_id(f"{type}{RoomFactory.number}")
        RoomFactory.number += 1

        return newRoom
