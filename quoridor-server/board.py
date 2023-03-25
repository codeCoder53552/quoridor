from enum import Enum
import time

# 9x9 with space between for walls
BOARD_DIM = 17

class Types(Enum):
    WALL = "W"
    EMPTY = "_"
    PLAYER_SPOT = "."
    REACHED = "X"

Types.EMPTY

class Board:
    def __init__(self) -> None:
        # python list comprehension
        # makes a BOARD_DIM x BOARD_DIM array of empty and player spaces
        self.board = [[Types.EMPTY if j % 2 == 1 or i % 2 == 1 else Types.PLAYER_SPOT for j in range(BOARD_DIM)] for i in range(BOARD_DIM)]

    def place_wall(self, x, y):
        self.board[y][x] = Types.WALL

    def __str__(self) -> str:
        out = ""
        for i in self.board:
            for j in i:
                out += j.value
            out += "\n"

        return out
    

    def flood(self, player_n, player_s, player_e = None, player_w = None):

        # do a flood starting at each player
        unknown = [player_n, player_s]

        if player_e != None:
            unknown.append(player_e)
        if player_w != None:
            unknown.append(player_w)

        while len(unknown) != 0:
            
        openList = [(x,y)]
        self.board[y][x] = Types.REACHED

        while len(openList) != 0:

            x, y = openList.pop()

            # right
            if x != BOARD_DIM - 1:
                if self.board[y][x+1] == Types.EMPTY and self.board[y][x+2] == Types.PLAYER_SPOT:
                    self.board[y][x+2] = Types.REACHED
                    openList.append((x+2,y))

            # left
            if x != 0:
                if self.board[y][x-1] == Types.EMPTY and self.board[y][x-1] == Types.PLAYER_SPOT:
                    self.board[y][x-1] = Types.REACHED
                    openList.append((x-2,y))

            # up
            if y != 0:
                if self.board[y-1][x] == Types.EMPTY and self.board[y-2][x] == Types.PLAYER_SPOT:
                    self.board[y-2][x] = Types.REACHED
                    openList.append((x,y-2))

            # down
            if y != BOARD_DIM - 1:
                if self.board[y+1][x] == Types.EMPTY and self.board[y+2][x] == Types.PLAYER_SPOT:
                    self.board[y+2][x] = Types.REACHED
                    openList.append((x,y+2))

            # DEBUG: print after each iteration
            print(self)
            print()
            time.sleep(1)

        for i in range(0,BOARD_DIM,2):
            for j in range(0,BOARD_DIM,2):
                self.board[i][j] = Types.PLAYER_SPOT
        

# this only runs if this is the main file
if __name__ == "__main__":
    board = Board()

    for i in range(0,BOARD_DIM):
        board.place_wall(i, 5)

    board.flood(0, 0)

    print(board)
