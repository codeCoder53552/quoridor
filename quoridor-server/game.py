from board import Board
import json

PLAYERS = ["player_n", "player_s", "player_e", "player_w"]

class Result:
    def __init__(self, success, data, gameOver = None):
        if success:
            self.success = success
            self.gameOver = gameOver
            self.possibleMoves = data
        else:
            self.success = success
            self.message = data

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__, 
            sort_keys=True, indent=4)


class QuoridorGame:
    def __init__(self):
        self.board = Board()
        self.players = {"player_n": None, "player_s": None, "player_e": None, "player_w": None}
        self.players_coords = {"player_n": (len(self.board.board)//2, 0), 
                            "player_s": (len(self.board.board)//2, len(self.board.board[0]) - 1), 
                            "player_e": (len(self.board.board) - 1, len(self.board.board[0])//2),
                            "player_w": (0, len(self.board.board[0])//2)}
        self.playerTurn = 0
        self.maxNumOfplayers = 2
        self.numOfActivePlayers = 0
        self.gameOver = False
        positions = self.get_player_coords()
        self.validMoves = self.board.valid_moves(positions[0], positions[1], positions[2], positions[3])

    def is_valid_move(self, coordinate, player):
        for move in self.validMoves.get(player):
            if tuple(coordinate) == move:
                return True
        return False
    
    def get_player_coord_from_move(self, move):
        row = move.row * 2
        column = move.col * 2
        return (row, column)
    
    def get_wall_coord_from_move(self, move):
        row = move.row * 2
        column = move.col * 2
        coordList = []
        if (move.direction == "bottom"):
            coordList.append((row + 1, column))
            coordList.append((row + 1, column + 1))
            coordList.append((row + 1, column + 2))
        
        return coordList



    def get_player_coords(self):
        index = 0
        playerPos = []
        for player in self.players_coords:
            if index < self.maxNumOfplayers:
                playerPos.append(self.players_coords.get(player))
            else:
                playerPos.append(None)
            index+=1
        
        return playerPos

    def make_move(self, playerId, move):
        print(f"{move.player} is attempting to play a {move.type} move on coordinate {move.coordinate}")
        try:
            if PLAYERS[self.playerTurn] == move.player:
                player = self.players.get(move.player)
                if player == playerId:
                    positions = self.get_player_coords()
                    if move.type == "wall":
                        coordinate = (move.row, move.col)
                        result = self.board.place_wall([coordinate], positions[0], positions[1], positions[2], positions[3])
                        if result:
                            self.validMoves = self.board.valid_moves(positions[0], positions[1], positions[2], positions[3])
                            self.playerTurn = (self.playerTurn + 1) % self.maxNumOfplayers
                            return Result(True, self.validMoves, self.gameOver)
                        else:
                            return Result(False, "Wall placement was not successful.")

                    elif move.type == "player":
                        coordinate = self.get_player_coord_from_move(move)
                        if self.is_valid_move(coordinate, move.player):
                            self.update_coords(move.player, coordinate)
                            self.validMoves = self.board.valid_moves(positions[0], positions[1], positions[2], positions[3])
                            self.gameOver = self.game_over(move.player, coordinate)
                            return Result(True, self.validMoves, self.gameOver)
                    else:
                        return Result(False, "Move is not a valid move type.")
                else:
                    return Result(False, "Player and playerID do not match.")
            else:
                return Result(False, "It's not the player's turn.")
        except KeyError:
            return Result(False, "Player attempting to make a move doesn't exist.")
        except AttributeError:
            return Result(False, "Move Object was formatted improperly.")
        except Exception as e:
            return Result(False, str(e))

    def add_player(self, playerID):
        players = self.players
        print(f"Attempting to add {playerID}")
        # This index will just be there to track how many players we want. For now it's just two.
        index = 0
        for playerNum in players:
            if index >= self.maxNumOfplayers: # Limits how many players can be in a game.
                return False
            elif players.get(playerNum) == playerID:
                self.numOfActivePlayers+=1
                return True
            elif players.get(playerNum) == None:
                players[playerNum] = playerID
                self.numOfActivePlayers+=1
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
        self.players_coords[player] = coords

    # Parameter types
    # coords, player_* : tuple (x, y)
    # place a wall to corresponding position
    def place_wall(self, coords, player_n = None, player_s = None, player_e = None, player_w = None):
        try:
            self.board.place_wall(coords, player_n, player_s, player_e, player_w)
            return True
        except Exception:
            return False


    # Parameter types
    # current_player: String; current_player_coords: tuple (x, y)
    # check for end game condition (game over or continue)
    def game_over(self, current_player, current_player_coords):
        x, y = current_player_coords
        if (current_player == "player_n" and y == len(self.board.board[0]) - 1)\
        or (current_player == "player_s" and y == 0)\
        or (current_player == "player_e" and x == 0)\
        or (current_player == "player_w" and x == len(self.board.board) - 1):
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
    