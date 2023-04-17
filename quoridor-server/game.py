from board import Board
import json

class Result:
    def __init__(self, success, message=None, gameboard = None, playerTurn = None, gameOver = None, validMoves=None,  wallsLeft = None):
        if success:
            self.success = success
            self.gameBoard = gameboard
            self.playerTurn = playerTurn
            self.gameOver = gameOver
            self.validMoves = validMoves
            self.wallsLeft = wallsLeft
        else:
            self.success = success
            self.message = message

    def toJSON(self):
        return json.dumps(self, default=lambda o: o.__dict__, 
            sort_keys=True, indent=4)
    
    def toDictionary(self):
        if self.success:
            dictResult = {"success":self.success, "gameBoard" : self.gameBoard, "playerTurn" : self.playerTurn, "gameOver" : self.gameOver,
                        "validMoves" : self.validMoves, "wallsLeft" : self.wallsLeft
                        }
            return dictResult
        else:
            dictResult = {"success" : self.success, "message" : self.message}
            return dictResult


class QuoridorGame:
    def __init__(self, maxPlayers=2):
        self.PLAYERS = ["player_n", "player_s", "player_e", "player_w"]
        self.board = Board()
        self.players = {"player_n": None, "player_s": None, "player_e": None, "player_w": None}
        self.players_coords = {"player_n": (len(self.board.board)//2, 0), 
                            "player_s": (len(self.board.board)//2, len(self.board.board[0]) - 1), 
                            "player_e": (len(self.board.board) - 1, len(self.board.board[0])//2),
                            "player_w": (0, len(self.board.board[0])//2)}
        self.playerTurn = 0
        self.maxNumOfplayers = maxPlayers
        self.numOfActivePlayers = 0
        self.gameOver = False
        positions = self.get_player_coords()
        self.validMoves = self.board.valid_moves(positions[0], positions[1], positions[2], positions[3])
        self.wallsLeft = [8,8, 8, 8]
        self.wallsPlayed = []

    def is_valid_move(self, coordinate, player):
        for move in self.validMoves.get(player):
            if coordinate == move:
                return True
        return False
    
    def get_player_coord_from_move(self, move):
        row = move.row * 2
        column = move.col * 2
        return (column, row)
    
    def get_wall_coord_from_move(self, move):
        x = move.col * 2
        y = move.row * 2
        coordList = []
        if (move.direction == "right"):
            coordList.append((x + 1, y))
            coordList.append((x + 1, y + 1))
            coordList.append((x + 1, y + 2))
        elif (move.direction == "bottom"):
            coordList.append((x, y + 1))
            coordList.append((x + 1, y + 1))
            coordList.append((x + 2, y + 1))
        
        print(f"Wall coords: {coordList}")
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
        print(f"{move.player} is attempting to play a {move.type} move on row {move.row} and col {move.col}")
        try:
            print(f"{self.PLAYERS[self.playerTurn]} and {move.player}")
            if self.PLAYERS[self.playerTurn] == move.player:
                player = self.players.get(move.player)
                if player == playerId:
                    positions = self.get_player_coords()
                    print(f"Positions: {positions}")
                    if move.type == "wall":
                        
                        if self.wallsLeft[self.playerTurn] <= 0:
                            return Result(False, "Player is out of walls to play.")
                        
                        coordinates = self.get_wall_coord_from_move(move)
                        print(f"Coordinates to place wall: {coordinates}")
                        if coordinates:
                            self.board.place_wall(coordinates, positions[0], positions[1], positions[2], positions[3])
                            self.validMoves = self.board.valid_moves(positions[0], positions[1], positions[2], positions[3])
                            self.wallsLeft[self.playerTurn] -= 1
                            recentPlayer = self.playerTurn
                            self.playerTurn = (self.playerTurn + 1) % self.maxNumOfplayers
                            wall = {"type": "wall", "row":move.row, "col": move.col, "direction" : move.direction}
                            self.wallsPlayed.append(wall)

                            return self.prep_result(recentPlayer)                            
                        else:
                            return Result(False, "Wall coordinates weren't translated well.")
                        
                    elif move.type == "player":
                        nineByNineCoord = (move.col, move.row)
                        coordinate = self.get_player_coord_from_move(move)
                        if self.is_valid_move(nineByNineCoord, move.player):
                            self.update_coords(move.player, coordinate)
                            positions = self.get_player_coords()
                            self.validMoves = self.board.valid_moves(positions[0], positions[1], positions[2], positions[3])
                            self.gameOver = self.game_over(move.player, coordinate)
                            recentPlayer = self.playerTurn
                            self.playerTurn = (self.playerTurn + 1) % self.maxNumOfplayers
                            return self.prep_result(recentPlayer)
                        else:
                            return Result(False, "Player move coordinate is not valid.")
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
        
    def prep_result(self, recentPlayer):
        gameBoard = self.prep_game_board()
        print(self.validMoves)
        return Result(True, None, gameBoard, self.playerTurn, self.gameOver, self.validMoves[self.PLAYERS[self.playerTurn]], self.wallsLeft[recentPlayer])

    def prep_game_board(self):
        gameBoard = []
        index = 0
        for player in self.PLAYERS:
            if index < self.maxNumOfplayers:
                playerTuple = self.players_coords.get(player)
                playerCol, playerRow = tuple(int(ti / 2) for ti in playerTuple)
                gameBoard.append({"type":"player", "row":playerRow, "col" : playerCol, "playerNum": index + 1})
                index+=1

        gameBoard.extend(self.wallsPlayed)

        # player1tuple = self.players_coords.get("player_n")
        # player2tuple = self.players_coords.get("player_s")

        # player1Col, player1Row = tuple(int(ti / 2) for ti in player1tuple)
        # player2Col, player2Row = tuple(int(ti / 2) for ti in player2tuple)

        # gameBoard = [{"type": "player", "row":player1Row, "col": player1Col, "playerNum":1},
        #              {"type": "player", "row":player2Row, "col": player2Col, "playerNum":2},]
        # gameBoard.extend(self.wallsPlayed)
        return gameBoard

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

# This is just a class to help test the game.
class Move:
    def __init__(self, type, row, col, player, direction = None):
        self.type = type
        self.row = row
        self.col = col
        self.player = player
        if type == "wall":
            self.direction = direction

# Uncomment to test game features.

# if __name__ == "__main__":
#     game = QuoridorGame()
#     game.add_player("player1")
#     game.add_player("player2")
#     move = Move("wall", 4, 4, "player_n", "bottom")
#     result = game.make_move("player1", move)
#     print(result.toJSON())

#     move = Move("player", 7, 4, "player_s")
#     result = game.make_move("player2", move)
#     print(result.toJSON())

#     print(game.board)
