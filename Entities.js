AllCards = function () {
    var self = {
        all_cards: []
    }

    self.generateCards = function () {
        var number = 0;
        // 5 pirates
        while (number++ < 5) {
            self.all_cards.push(PirateCard());
        }
        number = 0;
        // 5 escapes
        while (number++ < 5) {
            self.all_cards.push(EscapeCard());
        }
        number = 0;
        // 2 mermaids
        while (number++ < 2) {
            self.all_cards.push(MermaidCard());
        }
        number = 0;
        // 1 scarymary
        while (number++ < 1) {
            self.all_cards.push(ScaryMaryCard());
        }
        number = 0;
        // 1 skull king
        while (number++ < 1) {
            self.all_cards.push(SkullKingCard());
        }
        number = 0;
        // yellow cards
        while (++number <= 13) {
            self.all_cards.push(NumberCard(number, "yellow"));
        }
        number = 0;
        // blue cards
        while (++number <= 13) {
            self.all_cards.push(NumberCard(number, "blue"));
        }
        number = 0;
        // red cards
        while (++number <= 13) {
            self.all_cards.push(NumberCard(number, "red"));
        }
        number = 0;
        // black cards
        while (++number <= 13) {
            self.all_cards.push(NumberCard(number, "black"));
        }
    }


    self.giveCard = function () {
        var randomIndex = randomIntFromInterval(0, self.all_cards.length - 1);
        var card = self.all_cards[randomIndex];
        self.all_cards.splice(randomIndex, 1);   // rmv the card from all_cards
        return card;
    }

    return self;
}

randomIntFromInterval = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}