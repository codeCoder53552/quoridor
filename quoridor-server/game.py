from board import Board

class QuoridorGame:
    def __init__(self):
        self.board = Board()
        self.players = {"player_n": None, "player_s": None, "player_e": None, "player_w": None}
        self.players_pos = {"player_n": (len(self.board)//2, 0), 
                            "player_s": (len(self.board)//2, len(self.board[0]) - 1), 
                            "player_e": (len(self.board) - 1, len(self.board[0])//2),
                            "player_w": (0, len(self.board[0])//2)}
        self.gameOver = False

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
    
    def update_position(self, player, position):
        self.players_pos[player] = position

    # Parameter types
    # current_player: String
    # current_player_pos: tuple (x, y)
    def game_over(self, current_player, current_player_pos):
        x, y = current_player_pos
        if current_player == "player_n" and y == len(self.board[0]) - 1:
            return True
        elif current_player == "player_s" and y == 0:
            return True
        elif current_player == "player_e" and x == 0:
            return True
        elif current_player == "player_w" and x == len(self.board) - 1:
            return True
        else:
            return False
    