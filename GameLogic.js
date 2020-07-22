PLAYER_LIST = {};
GAME_INSTANCES = {};

GameInstance = function () {
    var self = {
        id: Math.random(),
        current_round: 0,
        starting_player_index: -1,
        current_player_id: null,
        next_player_id: null,
        starting_player: null,
        played_cards: [],
        playingField: new PlayingField(true)
    };
    return self;
}


startNextRound = function (lobbyID) {
    GAME_INSTANCES[lobbyID].current_round++;

    if (GAME_INSTANCES[lobbyID].current_round > 10) {
        var player_point_list = [];
        for (var i in PLAYER_LIST) {
            if (PLAYER_LIST[i].lobbyID != lobbyID) continue;
            var m_data = {
                name: PLAYER_LIST[i].socket.name,
                points: PLAYER_LIST[i].points
            }
            player_point_list.push(m_data);
        }
        finishGame(lobbyID, player_point_list);
        return;
    }

    all_cards = AllCards();
    all_cards.generateCards();  // generate game cards for this round

    GAME_INSTANCES[lobbyID].playingField.reset();

    GAME_INSTANCES[lobbyID].starting_player = getStartingPlayer(lobbyID);

    // set a timer, starting from 9 sec + the current round
    // after the timer is over, we want a bet from every player
    let timer = 9;
    timer += GAME_INSTANCES[lobbyID].current_round;

    // give cards and start round for all players
    for (let i in PLAYER_LIST) {
        if (PLAYER_LIST[i].lobbyID != lobbyID) continue;
        let counter = 0;
        while (counter < GAME_INSTANCES[lobbyID].current_round) {
            PLAYER_LIST[i].takeCard(all_cards.giveCard());
            counter++;
        }
        PLAYER_LIST[i].updateCardDeck();
        PLAYER_LIST[i].roundReset();    // reset the player round attributes for the new round

        let data = {
            starting_player: (GAME_INSTANCES[lobbyID].starting_player.id == i) ? "YOU" : GAME_INSTANCES[lobbyID].starting_player.name,
            timer: timer,
            current_round: GAME_INSTANCES[lobbyID].current_round
        }

        PLAYER_LIST[i].socket.emit('roundStart', data);
    }

    updatePlayerBoard(PLAYER_LIST[GAME_INSTANCES[lobbyID].starting_player.id], lobbyID);    // update the player board with no bets made yet

    // count down the timer
    var m_time_interval = setInterval(function waitForBets() {
        if (--timer === 0) {
            var length = 0;
            for (var i in PLAYER_LIST) {
                length++;
            }
            if (length == 0) return;
            clearInterval(m_time_interval);
            // TIME IS OVER! Get a bet from every player
            for (var i in PLAYER_LIST) {
                if (PLAYER_LIST[i].lobbyID != lobbyID) continue;
                if (PLAYER_LIST[i].trick_round_bet == -1) {
                    // player has not made a trick bet, give him 1 by default
                    PLAYER_LIST[i].trick_round_bet = 1;
                    PLAYER_LIST[i].socket.emit('betForced');
                }
            }
            // start the round!
            var player_bet_list = [];

            for (var i in PLAYER_LIST) {
                if (PLAYER_LIST[i].lobbyID !== lobbyID) continue;   // player of another lobby
                var player_bet_item = {
                    player_name: PLAYER_LIST[i].socket.name,
                    bet: PLAYER_LIST[i].socket.trick_round_bet
                }
                player_bet_list.push(player_bet_item);
            }

            // give the player who is next control
            PLAYER_LIST[GAME_INSTANCES[lobbyID].starting_player.id].socket.emit('giveControl');

            // continue with updating the player board with their bets
            updatePlayerBoard(PLAYER_LIST[GAME_INSTANCES[lobbyID].starting_player.id], lobbyID);
        }
    }, 1000);
}

getStartingPlayer = function (lobbyID) {
    var starting_player_data = {
        id: 0,
        name: " "
    }
    GAME_INSTANCES[lobbyID].starting_player_index++;
    GAME_INSTANCES[lobbyID].next_player_id = null;

    // if the end of the player list has been reached, go to start again
    var list_length = 0;
    for (var i in PLAYER_LIST) {
        if (PLAYER_LIST[i].lobbyID != lobbyID) continue;
        list_length++;
    }
    if (GAME_INSTANCES[lobbyID].starting_player_index === list_length)
        GAME_INSTANCES[lobbyID].starting_player_index = 0;

    // select the starting player
    var counter = 0;
    for (var i in PLAYER_LIST) {
        if (PLAYER_LIST[i].lobbyID != lobbyID) continue;
        if (counter++ == GAME_INSTANCES[lobbyID].starting_player_index) {
            starting_player_data.id = i;
            starting_player_data.name = PLAYER_LIST[i].socket.name;
            break;
        }
    }
    GAME_INSTANCES[lobbyID].current_player_id = starting_player_data.id;    // make the starting player the current player aswell
    return starting_player_data;
}

getNextPlayerID = function (lobbyID) {
    var next = false;
    for (var i in PLAYER_LIST) {
        if (PLAYER_LIST[i].lobbyID != lobbyID) continue;
        if (i == GAME_INSTANCES[lobbyID].current_player_id) {
            next = true;    // next was set to true, now set the next match as current_player
            continue;   // skip the current player
        }
        if (next) {
            GAME_INSTANCES[lobbyID].current_player_id = i;
            next = false;
            break;
        }
    }
    if (next) {    // no next player to choose was found, so begin at the start of the list again and pick the first match
        for (var i in PLAYER_LIST) {
            if (PLAYER_LIST[i].lobbyID != lobbyID) continue;
            GAME_INSTANCES[lobbyID].current_player_id = i;
            break;
        }
    }
    return GAME_INSTANCES[lobbyID].current_player_id;
}

updatePlayerBoard = function (nextPlayer, lobbyID) {
    for (var i in PLAYER_LIST) {
        if (PLAYER_LIST[i].lobbyID !== lobbyID) continue;   // player of another lobby

        // create a player list and give this info to the round start emit
        var player_data = [];
        for (var i2 in PLAYER_LIST) {
            if (PLAYER_LIST[i2].lobbyID != lobbyID) continue;
            var m_data = {
                name: PLAYER_LIST[i2].socket.name,
                trick_round_bet: PLAYER_LIST[i2].trick_round_bet,
                tricks_this_round: PLAYER_LIST[i2].tricks_this_round,
                points: PLAYER_LIST[i2].points
            }
            player_data.push(m_data);
        }

        PLAYER_LIST[i].socket.emit('updatePlayerData', {
            player_name: PLAYER_LIST[i].socket.name,
            player_data: player_data,
            starting_player: (nextPlayer.socket.id == i) ? "YOU" : nextPlayer.socket.name
        });
    }
}

displayRoundResults = function (lobbyID, player_round_results) {
    for (var i in PLAYER_LIST) {
        if (PLAYER_LIST[i].lobbyID !== lobbyID) continue;   // player of another lobby
        PLAYER_LIST[i].socket.emit('displayRoundResults', player_round_results);
    }
}

isCardAllowed = function (card, player) {
    if (card.type === "Number") {
        let firstColoredCard = getFirstColoredCard(player.lobbyID);
        if (firstColoredCard !== null) {
            // a colored card has been played already in this round
            if (card.color !== firstColoredCard.color) {
                // the card is not of the same color as the first played card
                for (let i = 0; i < player.card_deck.length; ++i) {
                    if (player.card_deck[i].type === "Number") {
                        if (player.card_deck[i].color === firstColoredCard.color)
                            return false;  // player has played a card of different color than the first played card, but he has the color of the first played card
                    }
                }
            }
        }
    }
    return true;
}

getFirstColoredCard = function (lobbyID) {
    for (let i = 0; i < GAME_INSTANCES[lobbyID].playingField.played_cards.length; ++i)
        if (GAME_INSTANCES[lobbyID].playingField.played_cards[i].type === "Number") return GAME_INSTANCES[lobbyID].playingField.played_cards[i];
    return null;
}

finishGame = function (lobbyID, player_point_list) {
    // get all the other players in the game, and quit their game
    for (var i in PLAYER_LIST) {
        if (PLAYER_LIST[i].lobbyID != lobbyID) continue;   // player of another lobby
        PLAYER_LIST[i].socket.state = 2;    // state 2 because player gets kicked into the lobby screen
        PLAYER_LIST[i].socket.emit("gameEnd", player_point_list);
        delete PLAYER_LIST[i];
    }

    // clear the lobby list
    switch (lobbyID) {
        case 1:
            for (var i in LOBBY_1_LIST) {
                delete LOBBY_1_LIST[i];
            }
            break;
        case 2:
            for (var i in LOBBY_2_LIST) {
                delete LOBBY_2_LIST[i];
            }
            break;
    }

    // update the lobby screen
    for (var i in SOCKET_LIST) {
        updateLobby(SOCKET_LIST[i], lobbyID);
    }
    // delete the game instance
    delete GAME_INSTANCES[lobbyID];
}