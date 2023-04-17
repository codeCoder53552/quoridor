from room import Room
from chat_room import ChatRoom
from quoridor_room import QuoridorRoom
import uuid
from enum import Enum
import random

from typing import Union

class RoomTypes:
    chat = "chat"
    game2 = "game2"
    game4 = "game4"

class RoomFactory:
    # increasing index
    number = 0
    # keep track of generated room codes
    roomCodes = []

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
        elif type == RoomTypes.game2:
            newRoom = QuoridorRoom(2)
            newRoom.spotsLeft = 2
        elif type == RoomTypes.game4:
            newRoom = QuoridorRoom(4)
            newRoom.spotsLeft = 4
        else:
            return None

        # give random roomid
        roomId = self.random_code()
        # make sure it isn't a duplicate code
        while roomId in RoomFactory.roomCodes:
            roomId = self.random_code()
        RoomFactory.roomCodes.append(roomId)
        newRoom.set_id(roomId)

        # # DEBUG: give rooms codes with sequential number
        # #   to make debugging easier
        # newRoom.set_id(f"{type}{RoomFactory.number}")
        # RoomFactory.number += 1

        return newRoom

    def random_code(self):
        # alphabet to make codes with
        # excludes confusing characters O, 0, I, 1
        alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        out = ""
        for i in range(5):
            out += alphabet[random.randint(0, len(alphabet) - 1)]
        return out

