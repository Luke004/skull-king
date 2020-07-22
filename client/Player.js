Card = function (type) {
    var self = {
        id: Math.random(),
        type: type//,
        //x: 0,
        //y: 0
    };

    self.draw = function (x, y) {
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.rect(x, y, CARD_WIDTH, CARD_HEIGHT);
        ctx.stroke();
    }
    return self;
}


NumberCard = function (number, color) {
    var self = Card("Number");
    self.number = number;
    self.color = color;

    var super_method = self.draw;
    self.draw = function (x, y) {
        super_method(x, y);
        ctx.textAlign = "center";
        ctx.fillStyle = self.color;
        ctx.fillRect(x, y, CARD_WIDTH, CARD_HEIGHT);
        if (color === "yellow") ctx.fillStyle = "black";
        else ctx.fillStyle = "white";
        ctx.font = "20px Georgia";
        ctx.fillText(self.number, x + (CARD_WIDTH / 2), y + (CARD_HEIGHT / 2) + 5);
    }

    return self;
}

PirateCard = function () {
    var self = Card("Pirate");

    var super_method = self.draw;
    self.draw = function (x, y) {
        super_method(x, y);
        ctx.textAlign = "center";
        ctx.font = "20px Georgia";
        ctx.fillStyle = "black";
        ctx.fillText("P", x + (CARD_WIDTH / 2), y + (CARD_HEIGHT / 2) + 5);
    }

    return self;
}

EscapeCard = function () {
    var self = Card("Escape");

    var super_method = self.draw;
    self.draw = function (x, y) {
        super_method(x, y);
        ctx.textAlign = "center";
        ctx.font = "20px Georgia";
        ctx.fillStyle = "black";
        ctx.fillText("Es", x + (CARD_WIDTH / 2), y + (CARD_HEIGHT / 2) + 5);
    }

    return self;
}

MermaidCard = function () {
    var self = Card("Mermaid");

    var super_method = self.draw;
    self.draw = function (x, y) {
        super_method(x, y);
        ctx.textAlign = "center";
        ctx.font = "20px Georgia";
        ctx.fillStyle = "black";
        ctx.fillText("M", x + (CARD_WIDTH / 2), y + (CARD_HEIGHT / 2) + 5);
    }

    return self;
}

ScaryMaryCard = function () {
    var self = Card("ScaryMary");
    self.xPos = undefined;

    var super_method = self.draw;
    self.draw = function (x, y) {
        super_method(x, y);
        self.xPos = x;
        ctx.textAlign = "center";
        ctx.font = "20px Georgia";
        ctx.fillStyle = "black";
        ctx.fillText("Sm", x + (CARD_WIDTH / 2), y + (CARD_HEIGHT / 2) + 5);
    }

    return self;
}

SkullKingCard = function () {
    var self = Card("SkullKing");

    var super_method = self.draw;
    self.draw = function (x, y) {
        super_method(x, y);
        ctx.textAlign = "center";
        ctx.strokeStyle = 'yellow';
        ctx.font = "20px Georgia";
        ctx.fillStyle = "black";
        ctx.fillText("SK", x + (CARD_WIDTH / 2), y + (CARD_HEIGHT / 2) + 5);
    }

    return self;
}

Player = function (socket, lobbyID) {
    var self = {
        socket: socket,
        lobbyID: lobbyID,
        card_deck: [],
        trick_round_bet: -1,
        tricks_this_round: 0,
        points: 0,
        possible_extra_points: 0
    }

    self.takeCard = function (card) {
        self.card_deck.push(card);
    }

    self.getCardByIdx = function (idx) {
        return self.card_deck[idx];
    }

    self.removeCardByID = function (cardID) {
        for (let i = 0; i < self.card_deck.length; ++i) {
            if (self.card_deck[i].id === cardID) {
                self.card_deck.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    self.drawCards = function () {
        // clear the draw card area
        ctx.clearRect(0, CANVAS_HEIGHT - 250, CANVAS_WIDTH - CARD_MARGIN * 2.5, 250);

        // clear the card coordinate list
        card_rect_coordinates = [];

        var card_margin = (self.card_deck.length - 1) * CARD_MARGIN / 2;
        var yPos = CANVAS_HEIGHT - CARD_HEIGHT - 20;
        var xPos = (CANVAS_WIDTH / 2) - ((self.card_deck.length * CARD_WIDTH) / 2) - card_margin;

        for (let i = 0; i < self.card_deck.length; ++i) {
            self.card_deck[i].draw(xPos, yPos);
            if (i === 0) card_rect_coordinates.push({ x: xPos, y: yPos, isSelectAllowed: false });    // add info at idx 1 that it's not allowed to draw cards yet
            else card_rect_coordinates.push({ x: xPos, y: yPos });
            xPos += CARD_WIDTH + CARD_MARGIN;
        }
    }

    self.updateCardDeck = function () {
        //server only
        if (self.socket) {
            self.socket.emit('updateCardDeck', self.card_deck);
            return;
        }
        //client only
        self.drawCards();
    }

    self.addTrick = function () {
        self.tricks_this_round++;
    }

    self.hasBetRight = function () {
        return self.tricks_this_round == self.trick_round_bet;
    }

    self.roundReset = function () {
        self.trick_round_bet = -1;
        self.tricks_this_round = 0;
        self.possible_extra_points = 0;
    }

    self.updatePoints = function (current_round) {
        if (!self.socket) return;   // this method is server only
        var player_data = { name: socket.name, point_gain: 0, points: 0, extra_points: 0 };
        if (self.hasBetRight()) {
            if (self.trick_round_bet == 0) { // player bet 0 round, this gives special point gain
                player_data.point_gain = current_round * 10;
                self.points += player_data.point_gain;
            } else {
                player_data.point_gain = self.tricks_this_round * 20;
                self.points += player_data.point_gain;
                if (self.possible_extra_points != 0) {
                    self.points += self.possible_extra_points;
                    player_data.extra_points = self.possible_extra_points;
                }
            }
        } else {
            if (self.trick_round_bet == 0) { // player bet 0 round wrong, this gives special point loss
                player_data.point_gain = -current_round * 10;
                self.points += player_data.point_gain;
            } else {
                player_data.point_gain = -Math.abs(self.tricks_this_round - self.trick_round_bet) * 10;
                self.points += player_data.point_gain;
            }
        }
        player_data.points = self.points;
        return player_data;
    }

    self.crashDeck = function () {
        let card_amount = self.card_deck.length;
        self.card_deck = [];  // reset the card deck

        let card_counter = 0;

        while (card_counter < card_amount) {
            var m_card = new EscapeCard();
            m_card.id = Math.random();
            self.takeCard(m_card);
            card_counter++;
        }

        self.updateCardDeck();
    }



    return self;
}

PlayingField = function (isServer) {
    var self = {
        isServer: isServer,
        played_cards: [],
        player_data: [],
        highest_card: null
    }

    self.drawCards = function () {
        if (isServer) return;
        // clear the playing field area
        ctx.clearRect(CARD_WIDTH * 2.5, CANVAS_HEIGHT / 2 - CARD_HEIGHT / 2 - 5, CANVAS_WIDTH - CARD_WIDTH * 5, CARD_HEIGHT + 10);

        var card_margin = (self.played_cards.length - 1) * CARD_MARGIN / 2;
        var yPos = CANVAS_HEIGHT / 2 - CARD_HEIGHT / 2;
        var xPos = (CANVAS_WIDTH / 2) - ((self.played_cards.length * CARD_WIDTH) / 2) - card_margin;

        for (let i = 0; i < self.played_cards.length; ++i) {
            if (self.played_cards[i].id == self.highest_card.id) {  // mark the highest card with a blue outline
                ctx.beginPath();
                ctx.lineWidth = 4;
                ctx.fillStyle = "black";
                ctx.strokeStyle = "#9cb7d9";
                ctx.rect(xPos - 3, yPos - 3, CARD_WIDTH + 6, CARD_HEIGHT + 6);
                ctx.stroke();
            }
            self.played_cards[i].draw(xPos, yPos);
            xPos += CARD_WIDTH + CARD_MARGIN;
        }
    }

    self.addCard = function (card) {
        if (isServer) {
            self.played_cards.forEach(m_card => {
                if (card.id == m_card.id) return true;  // return true if card already exists in deck
            });
        }

        self.played_cards.push(card);
        self.updateHighestCard(card);
        return false;
    }

    self.addPlayerID = function (id) {
        // this is a server only function
        if (!isServer) return;
        self.player_data.push({ id: id, extra_points: 0 });
    }


    self.updateHighestCard = function (new_card) {
        if (self.highest_card === null) {
            self.highest_card = new_card;
            return;
        }
        // there is already a highest card, check if this one is higher
        switch (self.highest_card.type) {
            case "Number":
                switch (new_card.type) {
                    case "Number":
                        // both cards are numbers
                        if (self.highest_card.color === "black") {
                            if (new_card.color !== "black") return;
                            if (new_card.number > self.highest_card.number) {
                                self.highest_card = new_card;
                                return;
                            }
                            else return;
                        } else {
                            if (new_card.color === "black") {
                                self.highest_card = new_card;
                                return;
                            }
                            if (new_card.color !== self.highest_card.color) return;
                            else {
                                // both cards have same color and are not black cards
                                if (new_card.number > self.highest_card.number) {
                                    self.highest_card = new_card;
                                    return;
                                }
                                else return;
                            }
                        }
                    case "SkullKing":
                    case "Pirate":
                    case "Mermaid":
                        // new card is a mermaid, a pirate or a skull king
                        self.highest_card = new_card;
                        return;
                    default:
                        return;
                }
            case "SkullKing":
                // currently highest card is the skull king
                switch (new_card.type) {
                    case "Mermaid":
                        // skull king was beaten by mermaid
                        self.highest_card = new_card;
                        if (isServer) {
                            // give the player who beat the skull king with a mermaid 50 extra points
                            self.player_data[self.played_cards.length - 1].extra_points += 50;
                        }
                        return;
                    case "Pirate":
                        // someone dumped a pirate on the skull king -> give the player who played the skull king extra points
                        for (let i = 0; i < self.played_cards.length - 1; ++i) {
                            if (self.played_cards[i].type === "SkullKing") {
                                self.player_data[i].extra_points += 30;
                                break;
                            }
                        }
                        return;
                    default:
                        return;
                }
            case "Pirate":
                // currently highest card is a pirate
                switch (new_card.type) {
                    case "SkullKing":
                        // new card is a skull king
                        // search the previously played cards for a mermaid that may have been beaten by a pirate
                        for (let i = 0; i < self.played_cards.length - 1; ++i) {
                            if (self.played_cards[i].type === "Mermaid") {
                                self.highest_card = self.played_cards[i];    // mermaid found, make it the highest card
                                if (isServer) {
                                    // look for the first mermaid in played_cards and give the player who played it 50 extra points
                                    for (let i = 0; i < self.played_cards.length; ++i) {
                                        if (self.played_cards[i].type === "Mermaid") {
                                            self.player_data[i].extra_points += 50;
                                            break;
                                        }
                                    }
                                }
                                return;
                            }
                        }
                        // no mermaid found, make skull king the highest card
                        self.highest_card = new_card;

                        // check if the skull king catched any pirates
                        // search the previously played cards for pirates
                        var extraPoints = 0;
                        for (let i = 0; i < self.played_cards.length - 1; ++i) {
                            if (self.played_cards[i].type === "Pirate") {
                                extraPoints += 30;  // pirate found, add extra points
                            }
                        }
                        if (isServer && extraPoints > 0) {
                            // give the player who played the skull king the extra points
                            self.player_data[self.played_cards.length - 1].extra_points += extraPoints;
                        }
                        return;
                    default:    // for every other card type, just return
                        return;
                }
            case "Escape":
                // currently highest card is a escape
                if (new_card.type !== "Escape") {
                    self.highest_card = new_card;
                    return;
                } else return;
            case "Mermaid":
                // currently highest card is a mermaid
                switch (new_card.type) {
                    case "SkullKing":
                        if (isServer) {
                            // give the player who played the mermaid 50 extra points
                            for (let i = 0; i < self.played_cards.length; ++i) {
                                if (self.played_cards[i].type === "Mermaid") {
                                    self.player_data[i].extra_points += 50;
                                    break;
                                }
                            }
                        }
                        return;
                    case "Pirate":
                        self.highest_card = new_card;
                        return;
                    default:
                        return
                }
        }
    }

    self.getRoundWinnningPlayerData = function () {
        if (!isServer) return;  // this is a server only function
        for (let i = 0; i < self.played_cards.length; ++i) {
            if (self.played_cards[i].id === self.highest_card.id) {
                return { id: self.player_data[i].id, extra_points: self.player_data[i].extra_points };
            }
        }
    }

    self.reset = function (lobbyID) {
        self.played_cards = [];
        self.player_data = [];
        self.highest_card = null;
        if (!isServer) {
            //client only
            self.drawCards();
        } else {
            // server only
            for (var i in PLAYER_LIST) {
                if (PLAYER_LIST[i].lobbyID != lobbyID) continue;
                PLAYER_LIST[i].socket.emit('resetPlayingField');
            }
        }
    }

    return self;
}

ScreenDrawer = function () {
    var self = {

    }

    self.drawTrickChooseScreen = function (starting_player, timer, current_round) {
        var card_margin = (player.card_deck.length - 1) * CARD_MARGIN / 2;
        var yPos = CANVAS_HEIGHT / 2;
        var xPos = (CANVAS_WIDTH / 2) - ((player.card_deck.length * CARD_WIDTH) / 2) - card_margin + CARD_WIDTH / 2;

        ctx.clearRect(CANVAS_WIDTH - 80, 0, 80, 50);  // clear the 'current round' text

        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.rect(CANVAS_WIDTH - 50 - CARD_MARGIN, CARD_MARGIN, 50, 50);
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = "red";
        ctx.font = "38px Open Sans";
        ctx.fillText(timer, CANVAS_WIDTH - 50 + 3, CARD_MARGIN + 37);

        var m_time_interval = window.setInterval(function startGame() {
            --timer;
            ctx.clearRect(CANVAS_WIDTH - 50 - CARD_MARGIN + 1, CARD_MARGIN + 1, 48, 48);
            ctx.fillStyle = "red";
            ctx.font = "38px Open Sans";
            ctx.fillText(timer, CANVAS_WIDTH - 50 + 3, CARD_MARGIN + 37);

            if (timer === 0) {
                clearInterval(m_time_interval);
                ctx.clearRect(CANVAS_WIDTH - 50 - CARD_MARGIN - 1, CARD_MARGIN - 1, 52, 52);
                self.drawCurrentRound(current_round);
                self.clearTrickChooseScreen();
            }
        }, 1000);

        ctx.fillStyle = "green";
        ctx.font = "bold 25px Open Sans";
        ctx.fillText("ROUND " + current_round, CANVAS_WIDTH / 2, yPos - 40);

        ctx.fillStyle = "black";
        ctx.font = "20px Open Sans";
        ctx.fillText("Player starting: " + starting_player, CANVAS_WIDTH / 2, yPos);

        ctx.font = "20px Open Sans";
        ctx.fillText("CHOOSE YOUR BET: ", CANVAS_WIDTH / 2, yPos + 40); // draw a text asking for bet

        var trickChoseRectNumberCounter = 0;
        trick_circle_coordinates.push({ x: CANVAS_WIDTH / 2 - TRICK_CHOOSE_ARC_RADIUS - 4 + CARD_WIDTH / 2, y: yPos + 80, number: trickChoseRectNumberCounter })
        self.drawTrickChooseCircle(CANVAS_WIDTH / 2 - TRICK_CHOOSE_ARC_RADIUS - 4 + CARD_WIDTH / 2, yPos + 80, trickChoseRectNumberCounter++);   // draw number zero in middle

        player.card_deck.forEach(function () {
            trick_circle_coordinates.push({ x: xPos, y: yPos + 135, number: trickChoseRectNumberCounter })
            self.drawTrickChooseCircle(xPos, yPos + 135, trickChoseRectNumberCounter++);    // draw a number to chose for a trick above each card
            xPos += CARD_WIDTH + CARD_MARGIN;
        });
    }

    self.drawCurrentRound = function (current_round) {
        let small_margin = 8;
        ctx.textAlign = "left";
        ctx.fillStyle = "green";
        ctx.font = "bold 15px Open Sans";
        let round_string = "ROUND " + current_round;
        let round_string_length = ctx.measureText(round_string).width + small_margin;
        let xPos = CANVAS_WIDTH - round_string_length;
        ctx.fillText("ROUND " + current_round, xPos, 20);
    }

    self.clearTrickChooseScreen = function () {
        ctx.clearRect(120, 230, CANVAS_WIDTH - 240, 130);
        ctx.clearRect(60, 360, CANVAS_WIDTH - 120, 110);
        trick_circle_coordinates = [];
        clicked_circle_data = null;
    }

    self.drawTrickChooseCircle = function (arcX, arcY, number, isHover) {
        ctx.beginPath();
        ctx.arc(arcX, arcY, TRICK_CHOOSE_ARC_RADIUS, 0, 2 * Math.PI);
        ctx.strokeStyle = 'black';
        if (isHover) {
            ctx.fillStyle = '#9cb7d9';
            ctx.lineWidth = 3;
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillStyle = "white";
            ctx.lineWidth = 1;
            ctx.fill();
            ctx.stroke();
        }
        ctx.fillStyle = "black";
        ctx.font = "20px Open Sans";
        ctx.fillText(number, arcX + (TRICK_CHOOSE_ARC_RADIUS / 2) - 10, arcY + (TRICK_CHOOSE_ARC_RADIUS / 2) - 3);
    }

    /* players data:
        name
        trick_round_bet
        tricks_this_round
        points
    */
    self.drawPlayerBoard = function (players, starting_player) {
        // the current player himself (bottom right corner)
        let player_self_x = CANVAS_WIDTH - CARD_MARGIN * 1.5, player_self_y = CANVAS_HEIGHT - CARD_MARGIN * 3;
        ctx.clearRect(player_self_x - CARD_MARGIN * 1.4, player_self_y - CARD_MARGIN,
            CARD_MARGIN * 3, CARD_MARGIN * 4);
        //ctx.font = "26px Candara";
        //ctx.fillText(players[0].name, CANVAS_WIDTH - CARD_MARGIN, 400);

        if (starting_player == "YOU") {   // you are the starting player, mark it
            self.drawTurnEllipse(player_self_x - 25, player_self_y - 60);
        } else {
            self.clearTurnEllipse(player_self_x - 25, player_self_y - 60);
        }
        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.font = "20px Candara";
        ctx.fillText(players[0].tricks_this_round + "/" + ((players[0].trick_round_bet == -1) ? " ?" : players[0].trick_round_bet),
            player_self_x, player_self_y);
        ctx.fillText(players[0].points, player_self_x, player_self_y + CARD_MARGIN * 2);

        let nextIdx = 1;    // this var keeps track of which player idx to draw next
        let next_player_x = 0, next_player_y = 0;  // the vars to hold all players coordinates
        let from_case_3 = false, from_case_5 = false, from_case_6 = false;
        // all the other players
        switch (players.length) {
            case 5: // -> 4 other players
                from_case_5 = true;
                nextIdx = 2;
                next_player_x = CANVAS_WIDTH / 4, next_player_y = CARD_MARGIN * 2;
                self.drawPlayerInfo(players, nextIdx, next_player_x, next_player_y);    // on top left sided
                if (starting_player == players[nextIdx].name) {
                    self.drawTurnEllipse(next_player_x + 40, next_player_y + 20);
                } else {
                    self.clearTurnEllipse(next_player_x + 40, next_player_y + 20);
                }
                nextIdx++;
                next_player_x = CANVAS_WIDTH - CANVAS_WIDTH / 4, next_player_y = CARD_MARGIN * 2;
                self.drawPlayerInfo(players, nextIdx, next_player_x, next_player_y);    // on top right sided
                if (starting_player == players[nextIdx].name) {
                    self.drawTurnEllipse(next_player_x - 85, next_player_y + 20);
                } else {
                    self.clearTurnEllipse(next_player_x - 85, next_player_y + 20);
                }
                nextIdx = 1;
            case 6:  // -> 5 other players
                if (!from_case_5) {
                    from_case_6 = true;
                    nextIdx = 2;
                    next_player_x = CARD_MARGIN * 1.5, next_player_y = CANVAS_HEIGHT / 4;
                    self.drawPlayerInfo(players, nextIdx, next_player_x, next_player_y);    // left side above player 2
                    if (starting_player == players[nextIdx].name) {
                        self.drawTurnEllipse(next_player_x + 30, next_player_y + 20);
                    } else {
                        self.clearTurnEllipse(next_player_x + 30, next_player_y + 20);
                    }
                    nextIdx += 2;
                    next_player_x = CANVAS_WIDTH - CARD_MARGIN * 1.5;       // y-val stays the same
                    self.drawPlayerInfo(players, nextIdx, next_player_x, next_player_y);    // right side above player 6
                    if (starting_player == players[nextIdx].name) {
                        self.drawTurnEllipse(next_player_x - 75, next_player_y + 20);
                    } else {
                        self.clearTurnEllipse(next_player_x - 75, next_player_y + 20);
                    }
                }
            case 3: // -> 2 other players (-> run code only from case 4 to print players on left and right side)
                if (!from_case_5 && !from_case_6) from_case_3 = true;
            case 4: // -> 3 other players
                nextIdx = 1;    // player on left side is the next player
                next_player_x = CARD_MARGIN * 1.5, next_player_y = CANVAS_HEIGHT / 2;
                self.drawPlayerInfo(players, nextIdx, next_player_x, next_player_y);    // draw player on left side
                if (starting_player == players[nextIdx].name) {
                    self.drawTurnEllipse(next_player_x + 30, next_player_y + 20);
                } else {
                    self.clearTurnEllipse(next_player_x + 30, next_player_y + 20);
                }
                // switch to player on right side
                if (from_case_3) nextIdx++;
                if (from_case_5) nextIdx += 3;
                if (from_case_6) nextIdx += 4;
                if (nextIdx == 1) nextIdx += 2;  // this is for case 4
                next_player_x = CANVAS_WIDTH - CARD_MARGIN * 1.5;   // y-val stays the same
                self.drawPlayerInfo(players, nextIdx, next_player_x, next_player_y);    // player on right side
                if (starting_player == players[nextIdx].name) {
                    self.drawTurnEllipse(next_player_x - 75, next_player_y + 20);
                } else {
                    self.clearTurnEllipse(next_player_x - 75, next_player_y + 20);
                }
                nextIdx = 2;  // for case 2 (player on top)
                if (from_case_6) nextIdx = 3;   // for case 6
                if (from_case_3 || from_case_5) break;
            case 2: // -> 1 other player
                next_player_x = CANVAS_WIDTH / 2;
                next_player_y = CARD_MARGIN * 2;
                self.drawPlayerInfo(players, nextIdx, next_player_x, next_player_y);    // top middle
                if (starting_player == players[nextIdx].name) {
                    self.drawTurnEllipse(next_player_x + 35, next_player_y + 22);
                }
                break;
        }
    }

    self.drawPlayerInfo = function (players, playerIdx, x, y) {
        ctx.clearRect(x - 100, y - 30, 200, 130); // clear rect

        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.font = "20px Candara";
        let name_string = players[playerIdx].name;
        if (name_string.length > 6) {
            name_string = name_string.substring(0, 5) + ".";
        }
        ctx.fillText(name_string, x, y);
        ctx.fillText(players[playerIdx].tricks_this_round + "/" + ((players[playerIdx].trick_round_bet == -1) ? " ?" : players[playerIdx].trick_round_bet),
            x, y + CARD_MARGIN * 2);
        ctx.fillText(players[playerIdx].points, x, y + CARD_MARGIN * 4);
    }

    self.drawRoundResults = function (player_round_results) {
        let yPos = CANVAS_HEIGHT - 165;
        let xPos = CANVAS_WIDTH / 2;
        player_round_results.forEach(player_data => {
            ctx.fillStyle = "black";
            ctx.font = "20px Open Sans";
            ctx.textAlign = "center";
            let round_result_string = player_data.name + ": " + player_data.points + " Points ("
                + ((player_data.point_gain > 0) ? "+" : "") + player_data.point_gain + ")";
            ctx.fillText(round_result_string, xPos, yPos);
            if (player_data.extra_points > 0) { // draw extra points (if there are such) colored in green after the normal points
                let xPos_extra_text = xPos + ctx.measureText(round_result_string).width / 2;
                ctx.fillStyle = "#229c55";
                ctx.textAlign = "left";
                ctx.fillText(" (+" + player_data.extra_points + " Extra)", xPos_extra_text, yPos);
            }
            yPos += 30;
        });
    }


    self.drawCardChooseScreen = function () {
        card_rect_coordinates[0].isSelectAllowed = true;    // allow the player to select and play a card
        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.font = "20px Open Sans";
        ctx.fillText("PLAY A CARD!", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 165); // draw a text asking for card
    }

    self.drawScaryMaryChooseScreen = function (param_xPos) {
        let yPos = 400;
        let xPos_pirate = param_xPos - CARD_WIDTH / 2 - CARD_MARGIN;
        let xPos_escape = param_xPos + CARD_WIDTH / 2 + CARD_MARGIN;
        ctx.clearRect(CANVAS_WIDTH / 2 - 65, yPos, 130, 50);    // remove 'PLAY A CARD!' text
        new PirateCard().draw(xPos_pirate, yPos);
        new EscapeCard().draw(xPos_escape, yPos);
        card_rect_coordinates = [];
        card_rect_coordinates.push({ x: xPos_pirate, y: yPos, isSelectAllowed: true });
        card_rect_coordinates.push({ x: xPos_escape, y: yPos });
    }

    self.drawEndResults = function (player_point_list) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);   // clear the whole screen
        player_point_list.sort(function (a, b) {
            return b.points - a.points;
        });

        let place = 1, yCord = CANVAS_HEIGHT / 2, max_text_width = 0;
        for (let i = 0; i < player_point_list.length; ++i) {
            let text = place++ + ". " + player_point_list[i].name + " (" + player_point_list[i].points + " Points)";
            if (ctx.measureText(text).width > max_text_width) max_text_width = ctx.measureText(text).width; // calculate the maximum text width
        }
        place = 1;
        ctx.textAlign = "left";
        ctx.fillStyle = "black";
        ctx.font = "20px Open Sans";
        for (let i = 0; i < player_point_list.length; ++i) {
            let text = place++ + ". " + player_point_list[i].name + " (" + player_point_list[i].points + " Points)";
            ctx.fillText(text, CANVAS_WIDTH / 2 - max_text_width / 2, yCord);
            yCord += 30;
        }
        self.drawReturnButton(yCord, false);
    }

    self.drawTurnEllipse = function (x, y) {
        var w = 50, h = 30; // width and height
        var kappa = .5522848,
            ox = (w / 2) * kappa, // control point offset horizontal
            oy = (h / 2) * kappa, // control point offset vertical
            xe = x + w,           // x-end
            ye = y + h,           // y-end
            xm = x + w / 2,       // x-middle
            ym = y + h / 2;       // y-middle

        ctx.beginPath();
        ctx.strokeStyle = '#384994';
        ctx.lineWidth = 1;
        ctx.fillStyle = "#384994";
        ctx.moveTo(x, ym);
        ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
        ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
        ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
        ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
        //ctx.closePath(); // not used correctly, see comments (use to close off open path)
        ctx.stroke();
        ctx.fill();

        ctx.textAlign = "center";
        ctx.fillStyle = "white";
        ctx.font = "bold 16px Candara";
        ctx.fillText("TURN", x + 24, y + 20);
    }

    self.clearTurnEllipse = function (x, y) {
        ctx.clearRect(x - 1, y - 1, 52, 32);
    }

    self.drawArrow = function (fromx, fromy, tox, toy, r) {
        var x_center = tox;
        var y_center = toy;

        var angle;
        var x;
        var y;

        ctx.beginPath();
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.stroke();

        ctx.beginPath();

        ctx.lineWidth = 10;
        ctx.strokeStyle = '#9cb7d9';
        ctx.fillStyle = '#9cb7d9'; // for the triangle fill
        ctx.lineJoin = 'butt';

        angle = Math.atan2(toy - fromy, tox - fromx)
        x = r * Math.cos(angle) + x_center;
        y = r * Math.sin(angle) + y_center;

        ctx.moveTo(x, y);

        angle += (1 / 3) * (2 * Math.PI)
        x = r * Math.cos(angle) + x_center;
        y = r * Math.sin(angle) + y_center;

        ctx.lineTo(x, y);

        angle += (1 / 3) * (2 * Math.PI)
        x = r * Math.cos(angle) + x_center;
        y = r * Math.sin(angle) + y_center;

        ctx.lineTo(x, y);

        ctx.closePath();

        ctx.fill();
    }

    self.drawReturnButton = function (yPos, isHover) {
        var rect_width = 120, rect_height = 40;
        var xPos = CANVAS_WIDTH / 2 - rect_width / 2;
        ctx.beginPath();
        ctx.rect(xPos, yPos, rect_width, rect_height);
        ctx.strokeStyle = 'black';
        if (isHover) {
            ctx.fillStyle = '#9cb7d9';
            ctx.lineWidth = 3;
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillStyle = "white";
            ctx.lineWidth = 1;
            ctx.fill();
            ctx.stroke();
        }
        ctx.fillStyle = "black";
        ctx.font = "20px Open Sans";
        ctx.fillText("RETURN", CANVAS_WIDTH / 2 - 37, yPos + 26);

        return_button_coordinates = { x: xPos, y: yPos, w: rect_width, h: rect_height };    // add the coordinates for on click listener in canvas
    }

    return self;
}