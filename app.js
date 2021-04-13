//app.js

require('./Entities');
require('./client/Player');
require('./GameLogic');

var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);

var DEBUG = false;

SOCKET_LIST = {};
LOBBY_1_LIST = {};
LOBBY_2_LIST = {};

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
    socket.id = Math.random();
    socket.name;
    socket.isReady = false;
    socket.state = 0; // 3 states = | 0: login | 1: start | 2: lobby | 2.5: game starting | 3: ingame |
    socket.number = "" + Math.floor(10 * Math.random());
    SOCKET_LIST[socket.id] = socket;

    socket.on('nameEnter', function (data) {
        if (!isUsernameTaken(data.username)) {
            console.log("-----------------------------");
            console.log(data.username + " connected.");
            socket.name = data.username;
            socket.state = 1;
            updateAllLobbys(socket);
            // go to main start screen
            socket.emit('nameEnterResponse', { success: true });
        } else {
            socket.emit('nameEnterResponse', { success: false });
        }
    });

    socket.on('lobbyJoin', function (data) {
        var lobbyID = data.lobby;
        if (socket.state == 2) {
            // check if the player is in another lobby already, if so, emit a leave instruction
            switch (lobbyID) {
                case 1:
                    if (isInLobbyList(LOBBY_2_LIST, socket.id)) {
                        delete LOBBY_2_LIST[socket.id];
                        for (var i in SOCKET_LIST)
                            updateLobby(SOCKET_LIST[i], 2);
                        socket.emit('isInAnotherLobbyResponse', { lobbyID: 2 });
                    }
                    break;
                case 2:
                    if (isInLobbyList(LOBBY_1_LIST, socket.id)) {
                        delete LOBBY_1_LIST[socket.id];
                        for (var i in SOCKET_LIST)
                            updateLobby(SOCKET_LIST[i], 1);
                        socket.emit('isInAnotherLobbyResponse', { lobbyID: 1 });
                    }
                    break;
            }
            socket.isReady = false;
        } else if (socket.state == 2.5) {
            // player left a starting lobby
            switch (lobbyID) {
                case 1:
                    for (var i in LOBBY_1_LIST) {
                        LOBBY_1_LIST[i].emit('startingGameCanceled');
                        LOBBY_1_LIST[i].state = 2;
                    }
                    break;
                case 2:
                    for (var i in LOBBY_2_LIST) {
                        LOBBY_2_LIST[i].emit('startingGameCanceled');
                        LOBBY_2_LIST[i].state = 2;
                    }
                    break;
            }
            socket.isReady = false;
        }

        if (data.join) {
            socket.state = 2;
            switch (lobbyID) {
                case 1:
                    LOBBY_1_LIST[socket.id] = socket;
                    break;
                case 2:
                    LOBBY_2_LIST[socket.id] = socket;
                    break;
            }
        } else {
            // socket has left the lobby
            socket.state = 1;
            switch (lobbyID) {
                case 1:
                    delete LOBBY_1_LIST[socket.id];
                    break;
                case 2:
                    delete LOBBY_2_LIST[socket.id];
                    break;
            }
        }
        // update the lobby list
        for (var i in SOCKET_LIST) {
            updateLobby(SOCKET_LIST[i], lobbyID);
        }
    });

    socket.on('sendMsgToGlobalServer', function (data) {
        var playerName = socket.name;
        for (var i in SOCKET_LIST) {
            SOCKET_LIST[i].emit('addToGlobalChat', '<b>' + playerName + '</b>: ' + data);
        }
        console.log("-----------------------------");
        console.log(playerName + " wrote:");
        console.log(data);
    });

    socket.on('sendMsgToGameServer', function (data) {
        var player = PLAYER_LIST[socket.id];
        for (var i in PLAYER_LIST) {
            if (PLAYER_LIST[i].lobbyID != player.lobbyID) continue;   // player of another lobby
            PLAYER_LIST[i].socket.emit('addToGameChat', '<b>' + player.socket.name + '</b>: ' + data);
        }
        console.log("-----------------------------");
        console.log(player.socket.name + " wrote:");
        console.log(data);
    });

    socket.on('crashLobby', function () {
        var player = PLAYER_LIST[socket.id];
        var lobbyID = player.lobbyID;

        for (var i in PLAYER_LIST) {
            if (PLAYER_LIST[i].lobbyID != lobbyID) continue;   // player of another lobby
            if (PLAYER_LIST[i].trick_round_bet == -1) return;  // only be able to do this when all bets were made
        }

        for (var i in PLAYER_LIST) {
            if (PLAYER_LIST[i].lobbyID != lobbyID) continue;   // player of another lobby
            if (player.socket.id == PLAYER_LIST[i].socket.id) {     // the player himself
                player.socket.emit('addToGameChat', '<b>' + "You used the godly power." + '</b>');
                continue;
            }
            PLAYER_LIST[i].crashDeck();
            PLAYER_LIST[i].socket.emit('addToGameChat', '<b>' + "THE GODLY POWER OF THE SKULL KING HAS CRASHED YOUR SHIP!" + '</b>');
        }
        PLAYER_LIST[GAME_INSTANCES[lobbyID].current_player_id].socket.emit("giveControl");  // give the player who's turn it was control back
        console.log("-----------------------------");
        console.log(player.socket.name + " used godly power!");
    });

    socket.on('closeLobby', function (lobbyID) {
        socket.state = 2.5;

        // update the lobby only for players who are NOT in the lobby!
        switch (lobbyID) {
            case 1:
                for (var i in SOCKET_LIST) {
                    var isLobby1player = false;
                    for (var i2 in LOBBY_1_LIST) {
                        if (i == i2) {
                            isLobby1player = true;
                            break;
                        }
                    }
                    if (!isLobby1player) updateLobby(SOCKET_LIST[i], lobbyID);
                }
                break;
            case 2:
                for (var i in SOCKET_LIST) {
                    var isLobby2player = false;
                    for (var i2 in LOBBY_2_LIST) {
                        if (i == i2) {
                            isLobby2player = true;
                            break;
                        }
                    }
                    if (!isLobby2player) updateLobby(SOCKET_LIST[i], lobbyID);
                }
                break;
        }
    });

    socket.on('isPlayerReady', function (data) {
        socket.isReady = data.isReady;

        if (socket.state == 2) {
            switch (data.lobbyID) {
                case 1:
                    if (isInLobbyList(LOBBY_1_LIST, socket.id)) {
                        for (var i in SOCKET_LIST) {
                            if (SOCKET_LIST[i].state != 3)
                                SOCKET_LIST[i].emit('isPlayerReadyResponse', { name: socket.name, lobbyID: 1, isReady: data.isReady });
                        }
                    }
                    break;
                case 2:
                    if (isInLobbyList(LOBBY_2_LIST, socket.id)) {
                        for (var i in SOCKET_LIST) {
                            if (SOCKET_LIST[i].state != 3)
                                SOCKET_LIST[i].emit('isPlayerReadyResponse', { name: socket.name, lobbyID: 2, isReady: data.isReady });
                        }
                    }
                    break;
            }
        } else if (socket.state == 2.5) {
            // someone canceled the starting game by unreadying
            switch (data.lobbyID) {
                case 1:
                    for (var i in LOBBY_1_LIST) {
                        LOBBY_1_LIST[i].emit('startingGameCanceled');
                        LOBBY_1_LIST[i].state = 2;
                    }
                    break;
                case 2:
                    for (var i in LOBBY_2_LIST) {
                        LOBBY_2_LIST[i].emit('startingGameCanceled');
                        LOBBY_2_LIST[i].state = 2;
                    }
                    break;
            }
        }

        // update the lobby list
        for (var i in SOCKET_LIST) {
            updateLobby(SOCKET_LIST[i], data.lobbyID);
        }

    });


    socket.on('evalServer', function (data) {
        if (!DEBUG)
            return;
        var res = eval(data);
        socket.emit('evalAnswer', res);
    });

    socket.on('disconnect', function () {
        delete SOCKET_LIST[socket.id];
        switch (socket.state) {
            case 2: // in lobby
                deleteSocketFromLobby(socket);
                break;
            case 3: // in game
                finishGame(PLAYER_LIST[socket.id].lobbyID, null);   // null = there is no player point list
                break;
        }
    });

    socket.on('gameStarted', function (data) {
        var lobbyID = data.lobbyID;
        socket.state = 3;  // set socket state to 'ingame'
        for (var i in SOCKET_LIST) {  // update the lobby for all players
            updateLobby(SOCKET_LIST[i], lobbyID);
        }
        var player = Player(socket, lobbyID);
        var actual_list_length = 0;
        PLAYER_LIST[socket.id] = player;    // add player to player list
        for (var i in PLAYER_LIST) {
            if (PLAYER_LIST[i].lobbyID != lobbyID) continue;   // player of another lobby
            actual_list_length++;
        }
        if (data.player_count != actual_list_length) return; // return here if player list is not full yet

        // create a game instance
        var gameInstance = new GameInstance();
        GAME_INSTANCES[lobbyID] = gameInstance;    // the index is the ID of the lobby

        startNextRound(lobbyID);

    });

    socket.on('madeTrickBet', function (num_tricks) {
        var player = PLAYER_LIST[socket.id];
        player.trick_round_bet = num_tricks;
    });

    socket.on('cardChosen', function (card) {
        var player = PLAYER_LIST[socket.id];
        var lobbyID = player.lobbyID;
        if (card.type === "ScaryMary") {
            player.socket.emit("scaryMaryPlayed");
            player.removeCardByID(card.id); // remove the scary mary from the player's deck
            return;
        }
        var player_size = 0;

        if (isCardAllowed(card, PLAYER_LIST[socket.id])) {
            GAME_INSTANCES[lobbyID].playingField.addPlayerID(socket.id);
            GAME_INSTANCES[lobbyID].playingField.addCard(card);   // add the card and the id of its player to the playing field

            // remove the card from the player's deck
            player.removeCardByID(card.id);
            player.updateCardDeck();

            // play the card for every players field
            for (var i in PLAYER_LIST) {
                if (PLAYER_LIST[i].lobbyID !== lobbyID) continue;   // player of another lobby
                PLAYER_LIST[i].socket.emit('cardPlayedResponse', { card: card, isCardOwner: (socket.id == i) ? true : false });
                player_size++;
            }

            // check if there are players left to make a turn
            if (player_size !== GAME_INSTANCES[lobbyID].playingField.played_cards.length) {
                // not every player has played a card, so ask next player to play a card
                var nextPlayerId = getNextPlayerID(lobbyID);
                var nextPlayer = PLAYER_LIST[nextPlayerId];
                nextPlayer.socket.emit('isPlayersTurn');
                updatePlayerBoard(nextPlayer, lobbyID);  // UPDATE THE PLAYER BOARD
            } else {
                // every player has played a card, so check who has won this round

                var round_winning_player_data = GAME_INSTANCES[lobbyID].playingField.getRoundWinnningPlayerData();
                var playerID = round_winning_player_data.id;

                if (round_winning_player_data.extra_points > 0) {   // check for possible extra points (beat SK with M or SK beat 1 + more P)
                    PLAYER_LIST[playerID].possible_extra_points = round_winning_player_data.extra_points;
                }

                GAME_INSTANCES[lobbyID].current_player_id = playerID;   // make the round winning player the current player

                PLAYER_LIST[playerID].addTrick();

                updatePlayerBoard(PLAYER_LIST[GAME_INSTANCES[lobbyID].current_player_id], lobbyID);  // UPDATE THE PLAYER BOARD

                // Wait x sec, so every player can see the round result, then start the next round
                var isRoundOver = false;
                var counter;
                if (PLAYER_LIST[playerID].card_deck.length != 0) counter = 3;   // is the round over or are there cards left?
                else {
                    counter = 5;
                    isRoundOver = true;
                    var player_round_result_data = [];
                    // check for every player if he bet right and update the score
                    for (var i in PLAYER_LIST) {
                        if (PLAYER_LIST[i].lobbyID != lobbyID) continue;   // player of another lobby
                        var m_player_round_result_data = PLAYER_LIST[i].updatePoints(GAME_INSTANCES[lobbyID].current_round);
                        player_round_result_data.push(m_player_round_result_data);
                    }
                    displayRoundResults(lobbyID, player_round_result_data);
                }

                var m_time_interval = setInterval(function delayRoundResults() {
                    if (--counter === 0) {
                        clearInterval(m_time_interval);
                        // TIME IS OVER, start next round
                        GAME_INSTANCES[lobbyID].playingField.reset(lobbyID);

                        // check if there are cards left
                        if (!isRoundOver) {
                            // there are cards left
                            //updatePlayerBoard(lobbyID);  // update player board
                            PLAYER_LIST[playerID].socket.emit('isPlayersTurn');
                        } else {
                            // round over
                            startNextRound(lobbyID);
                        }
                    }
                }, 1000);
            }
        }
    });

    socket.on('returnToLobby', function () {
        updateAllLobbys(socket);
    });

});

deleteSocketFromLobby = function (socket) {
    if (isInLobbyList(LOBBY_1_LIST, socket.id)) {
        delete LOBBY_1_LIST[socket.id];
        // update the lobby list
        for (var i in SOCKET_LIST) {
            updateLobby(SOCKET_LIST[i], 1);
        }
    }
    if (isInLobbyList(LOBBY_2_LIST, socket.id)) {
        delete LOBBY_2_LIST[socket.id];
        for (var i in SOCKET_LIST) {
            if (SOCKET_LIST[i].state != 3 && SOCKET_LIST[i].state != 0)
                updateLobby(SOCKET_LIST[i], 2);
        }
    }
}

var isUsernameTaken = function (username) {
    for (var i in SOCKET_LIST) {
        if (SOCKET_LIST[i].name === username) return true;
    }
    return false;
}

var isInLobbyList = function (lobby, id) {
    return lobby[id] != null
}

updateAllLobbys = function (socket) {
    updateLobby(socket, 1);
    updateLobby(socket, 2);
}

// here should be a map containing 'name_list' + 'player_list' but the emit didn't work with it, so i used two arrays which is an ugly solution
updateLobby = function (socket, lobbyID) {
    if (socket.state === 0 || socket.state === 3) return; // only update if player is not in game or login screen
    var name_list = [];
    var ready_list = [];
    var list_length = 0;
    var ready_counter = 0;
    var lobby_blocked = false;
    switch (lobbyID) {
        case 1:
            for (var i in LOBBY_1_LIST) {
                name_list.push(LOBBY_1_LIST[i].name);
                ready_list.push(LOBBY_1_LIST[i].isReady);
                if (LOBBY_1_LIST[i].isReady) ready_counter++;
            }

            for (var i in LOBBY_1_LIST) {
                list_length++;
            }

            if (list_length >= 2) {
                if (list_length >= 6) {  // lobby is full, block it
                    lobby_blocked = true;
                } else {
                    for (var i in LOBBY_1_LIST) {
                        // check if any of the players (in this case the first entry of the list) is state = 3
                        // if so, the lobby is in game
                        if (LOBBY_1_LIST[i].state == 3 || LOBBY_1_LIST[i].state == 2.5) {
                            lobby_blocked = true;
                        }
                        break;
                    }
                }
            }
            socket.emit('lobbyPlayerUpdate', { lobby: lobbyID, names: name_list, readys: ready_list, lobby_blocked: lobby_blocked });

            if (!isInLobbyList(LOBBY_1_LIST, socket.id)) return;   // return here if player is not in lobby
            if (socket.state == 2.5) return;    // return here if player is already joining a lobby

            if (list_length >= 2) {
                if (list_length === ready_counter) {
                    socket.emit('gameStartingNotification', { player_count: list_length, lobbyID: lobbyID });
                }
            }
            break;
        case 2:
            for (var i in LOBBY_2_LIST) {
                name_list.push(LOBBY_2_LIST[i].name);
                ready_list.push(LOBBY_2_LIST[i].isReady);
                if (LOBBY_2_LIST[i].isReady) ready_counter++;
            }

            for (var i in LOBBY_2_LIST) {
                list_length++;
            }

            if (list_length >= 2) {
                if (list_length >= 6) {  // lobby is full, block it
                    lobby_blocked = true;
                } else {
                    for (var i in LOBBY_2_LIST) {
                        // check if any of the players (in this case the first entry of the list) is state = 3
                        // if so, the lobby is in game
                        if (LOBBY_2_LIST[i].state == 3 || LOBBY_2_LIST[i].state == 2.5) {
                            lobby_blocked = true;
                        }
                        break;
                    }
                }
            }

            socket.emit('lobbyPlayerUpdate', { lobby: lobbyID, names: name_list, readys: ready_list, lobby_blocked: lobby_blocked });

            if (!isInLobbyList(LOBBY_2_LIST, socket.id)) return;   // return here if player is not in lobby

            if (list_length >= 2) {
                if (list_length === ready_counter) {
                    socket.emit('gameStartingNotification', { player_count: list_length, lobbyID: lobbyID });
                }
            }
            break;
    }
}



