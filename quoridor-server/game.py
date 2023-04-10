from board import Board

PLAYERS = ["player_n", "player_s", "player_e", "player_w"]

class QuoridorGame:
    def __init__(self):
        self.board = Board()
        self.players = {"player_n": None, "player_s":None, "player_e":None, "player_w":None}
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

    def game_over(self):
        self.gameOver = True
    