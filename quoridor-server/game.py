from board import Board

class QuoridorGame:
    def __init__(self):
        self.board = Board()
        self.players = {1: None, 2:None}
        self.gameOver = False

    def add_player(self, playerID):
        players = self.players
        for playerNum in players:
            if players.get(playerNum) == playerID:
                return True
            elif not players.get(playerNum):
                players[playerNum] = playerID
                return True
        return False
    
    def remove_player(self, playerID):
        playerIDs = list(self.players.values())
        playerNums = list(self.players.keys())
        try:
            position = playerIDs.index(playerID)
        except ValueError:
            return None
            
        playerNum = playerNums[position]

        try:
            self.players[playerNum] = None
        except KeyError:
            return None

        return playerNum

    def game_over(self):
        self.gameOver = True
    