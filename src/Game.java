import cards.*;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

public class Game {
    private final static int FINAL_ROUND = 10;
    private int current_round;
    private ArrayList<Player> players;
    private CardStock cardStock;
    private Map<Player, Card> playingField;
    Scanner reader = new Scanner(System.in);  // Reading from System.in


    Game() {
        players = new ArrayList<>();
        current_round = 1;
    }

    public void run() {
        System.out.println("Welcome to Skull King!\nHow much players?[2-6]?");
        int player_size = reader.nextInt();
        for (int i = 0; i < player_size; ++i) {
            System.out.println("What's the name of player " + (i + 1) + "?");
            String player_name = reader.next();
            players.add(new Player(player_name));
        }

        while (current_round <= FINAL_ROUND) {
            startNextRound();
            current_round++;
        }

        //once finished
        //reader.close();
    }

    public void startNextRound() {
        System.out.println("Round " + current_round + " starting!");
        playingField = new LinkedHashMap<>();
        cardStock = new CardStock();
        // give each player as much cards as the round number is
        for (Player player : players) {
            int card_amount = current_round;
            while (card_amount > 0) {
                player.giveCard(cardStock.takeCard());
                --card_amount;
            }
        }

        // ask for the bet of every player
        for (Player player : players) {
            System.out.println(player + "'s turn!");
            player.showDeck();
            player.askForBet();
        }

        // let every player play a card as long as there are cards left
        int cards_left = current_round;
        while (cards_left > 0) {
            for (Player player : players) {
                System.out.println(player + "'s turn!");
                player.showDeck();
                Card card = player.askForCard();
                playingField.put(player, card);
            }
            printPlayingField();
            checkForRoundWin();
            --cards_left;
        }


        // displayRoundResults();


    }

    void printPlayingField() {
        System.out.println("Playing Field:");
        Iterator it = playingField.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry pair = (Map.Entry) it.next();
            System.out.println(pair.getKey() + ": [" + pair.getValue() + "]");
            //it.remove(); // avoids a ConcurrentModificationException
        }
    }

    void checkForRoundWin() {
        Map.Entry highest_pair = GameLogic.getHighestRankedPair(playingField);
        System.out.println(highest_pair.getKey() + " won the round!");
    }

    void displayRoundResults() {

    }

    private class CardStock {
        private ArrayList<Card> game_cards;

        CardStock() {
            game_cards = new ArrayList<>();

            // 5 Pirates
            for (int i = 0; i < 5; ++i)
                game_cards.add(new PirateCard());

            // 5 Escapes
            for (int i = 0; i < 5; ++i)
                game_cards.add(new EscapeCard());

            // 2 Mermaids
            for (int i = 0; i < 2; ++i)
                game_cards.add(new MermaidCard());

            // 1 ScaryMary
            game_cards.add(new ScaryMaryCard());

            // 1 SkullKing
            game_cards.add(new SkullKingCard());

            // Colored Cards
            CardColor[] cardColors = {CardColor.BLUE, CardColor.RED, CardColor.YELLOW, CardColor.BLACK};
            for (CardColor cardColor : cardColors) {
                int card_number = NumberCard.MIN_CARD_VALUE;
                while (card_number <= NumberCard.MAX_CARD_VALUE) {
                    game_cards.add(new NumberCard(cardColor, card_number));
                    ++card_number;
                }
            }
        }


        Card takeCard() {
            int min_index = 0;
            int max_index = game_cards.size() - 1;
            int random_index = ThreadLocalRandom.current().nextInt(min_index, max_index + 1);
            Card cardToGive = game_cards.get(random_index);
            game_cards.remove(random_index);
            return cardToGive;
        }
    }
}
