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

        """
        the parameters represent player locations as a tupple of (x,y)
        For example, player_n is the (x,y) tupple for the player trying to
        go north or up.

        psudo code:
        make dictionary of tupple to playerId

        while dictionary is not empty:
            start a flood starting at one of the players
            keep a list of everything that touches the current flood
            (this includes borders and players)
            if another player can be reached from this flood, add to reached and remove from dictionary
        """

        # dictonary of player positions were we don't know how they
        # connect yet
        unknown = {
            player_n: "player_n",
            player_s: "player_s"
        }

        # for each player, can they reach their destination?
        reachable = {
            "player_n": False,
            "player_s": False,
            "player_e": False,
            "player_w": False
        }

        # player_e and player_w are only needed for four player
        if player_e != None:
            unknown[player_e] = "player_e"
        if player_w != None:
            unknown[player_w] = "player_w"

        while len(unknown) != 0:
            positionTupple, playerId = unknown.popitem()
            x, y = positionTupple
            # reached = players and boarders hit in current fill
            reached = [playerId]

            # when a tile gets hit, all tiles arround it get added to openList
            # only if thoes tiles haven't been REACHED yet
            openList = [(x,y)]
            self.board[y][x] = Types.REACHED

            while len(openList) != 0:
                # take a tile to calculate from open list
                x, y = openList.pop()

                ## check current grid conditions
                # if any other players are hit in this fill, we don't have to redo them later
                if (x, y) in unknown.keys():
                    reached.append(unknown[(x,y)])
                    unknown.pop((x,y))

                # western border reached
                if x == 0:
                    reached.append("w")
                # eastern border reached
                if x == BOARD_DIM - 1:
                    reached.append("e")
                # norhern border reached
                if y == 0:
                    reached.append("n")
                # southern border reached
                if y == BOARD_DIM - 1:
                    reached.append("s")

                ## add neighbors to openList

                # right
                if x != BOARD_DIM - 1:
                    if self.board[y][x+1] == Types.EMPTY and self.board[y][x+2] == Types.PLAYER_SPOT:
                        self.board[y][x+2] = Types.REACHED
                        openList.append((x+2,y))

                # left
                if x != 0:
                    if self.board[y][x-1] == Types.EMPTY and self.board[y][x-2] == Types.PLAYER_SPOT:
                        self.board[y][x-2] = Types.REACHED
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
                time.sleep(.1)

            # the reached list will contain players and
            # edges that got hit in this flood
            # EX: reached = ["player_n", "n"]
            for i in reached:
                # if player
                if len(i) > 1:
                    # last letter of player name is its goal
                    goal = i[-1]
                    reachable[i] = goal in reached

        # clear board so this can rerun the next time
        for i in range(0,BOARD_DIM,2):
            for j in range(0,BOARD_DIM,2):
                self.board[i][j] = Types.PLAYER_SPOT

        return reachable


# this only runs if this is the main file
if __name__ == "__main__":
    board = Board()

    for i in range(0,BOARD_DIM):
        board.place_wall(i, 5)

    reachable = board.flood((8, 4), (0, 8))

    print(board)
