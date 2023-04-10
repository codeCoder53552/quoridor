from board import Board

PLAYERS = ["player_n", "player_s", "player_e", "player_w"]

class QuoridorGame:
    def __init__(self):
        self.board = Board()
        self.players = {"player_n": None, "player_s": None, "player_e": None, "player_w": None}
        self.players_coords = {"player_n": (len(self.board)//2, 0), 
                            "player_s": (len(self.board)//2, len(self.board[0]) - 1), 
                            "player_e": (len(self.board) - 1, len(self.board[0])//2),
                            "player_w": (0, len(self.board[0])//2)}
        self.playerTurn = 0
        self.gameOver = False

    def make_move(self, playerId, move):
        print(playerId)
        print(move)
        try:
            if self.players.get(move.player):
                print("We got a player, let's make a move.")
            else:
                return "It's not the players turn."
        except KeyError:
            return "Invalid JSON"
        pass

    def add_player(self, playerID):
        players = self.players
        # This index will just be there to track how many players we want. For now it's just two.
        index = 0
        for playerNum in players:
            if index == 1:
                return False
            elif players.get(playerNum) == playerID:
                return True
            elif not players.get(playerNum):
                players[playerNum] = playerID
                return True
            index+=1

        return False
    
    def remove_player(self, playerID):
        playerIDs = list(self.players.values())
        playerNames = list(self.players.keys())
        try:
            position = playerIDs.index(playerID)
        except ValueError:
            return None
            
        playerNum = playerNames[position]

        try:
            self.players[playerNum] = None
        except KeyError:
            return None

        return playerNum
    
    # Parameter types
    # player: String; coords: tuple (x, y)
    # update position for any player
    def update_coords(self, player, coords):
        self.players_pos[player] = coords

    # Parameter types
    # coords, player_* : tuple (x, y)
    # place a wall to corresponding position
    def place_wall(self, coords, player_n = None, player_s = None, player_e = None, player_w = None):
        self.board.place_wall(coords, player_n, player_s, player_e, player_w)

    # Parameter types
    # current_player: String; current_player_coords: tuple (x, y)
    # check for end game condition (game over or continue)
    def game_over(self, current_player, current_player_coords):
        x, y = current_player_coords
        if (current_player == "player_n" and y == len(self.board[0]) - 1)\
        or (current_player == "player_s" and y == 0)\
        or (current_player == "player_e" and x == 0)\
        or (current_player == "player_w" and x == len(self.board) - 1):
            return True
        else:
            return False
    
    # reset the game board without removing existing players
    def reset(self):
        self.board = Board()
        self.players_coords = {"player_n": (len(self.board)//2, 0), 
                            "player_s": (len(self.board)//2, len(self.board[0]) - 1), 
                            "player_e": (len(self.board) - 1, len(self.board[0])//2),
                            "player_w": (0, len(self.board[0])//2)}
        self.gameOver = False
    