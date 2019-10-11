import cards.*;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

public class Game {
    private final static int FINAL_ROUND = 10;
    private int current_round;
    private ArrayList<Player> players;
    Player beginning_player;
    Player[] player_order; // this array holds the correct order of players turns
    int player_begin_index; // this index holds the index of the next player who's turn it is
    private CardStock cardStock; // holds all cards that exist in this game
    private Map<Player, Card> playingField; // holds all cards currently put on field by all players
    Scanner reader = new Scanner(System.in);  // Reading from System.in


    Game() {
        players = new ArrayList<>();
        cardStock = new CardStock();
        playingField = new LinkedHashMap<>();
        current_round = 1;
        player_begin_index = -1;
    }

    public void run() {
        System.out.println("Welcome to Skull King!\nHow much players?[2-6]?");
        int player_size = reader.nextInt();
        player_order = new Player[player_size];
        for (int i = 0; i < player_size; ++i) {
            System.out.println("What's the name of Player " + (i + 1) + "?");
            String player_name = reader.next();
            Player player = new Player((player_name));
            players.add(player);
            player_order[i] = player;
        }
        // set player 1 as the beginning player on start of each game
        beginning_player = player_order[0];

        while (current_round <= FINAL_ROUND) {
            // at each round, the next player begins
            if (player_begin_index < player_order.length - 1) {
                player_begin_index++;
            } else {
                player_begin_index = 0;
            }
            beginning_player = player_order[player_begin_index];
            GameLogic.sortPlayerList(players, beginning_player);
            System.out.println(beginning_player + " begins!");
            startNextRound();
            current_round++;
        }

        //once finished
        //reader.close();
    }

    public void startNextRound() {
        System.out.println("------------------");
        System.out.println("Round " + current_round + " starting!");
        System.out.println("------------------");
        cardStock.createNewCardStock();
        // give each player as much cards as the round number is
        for (Player player : players) {
            int card_amount = current_round;
            while (card_amount > 0) {
                player.giveCard(cardStock.takeCard());
                --card_amount;
            }
        }
        GameLogic.sortPlayerList(players, beginning_player);

        // reset every player and ask for their bet
        for (Player player : players) {
            System.out.println(player + "'s turn!");
            player.reset();
            player.showDeck();
            player.askForBet();
        }

        // let every player play a card as long as there are cards left
        int cards_left = current_round;
        while (cards_left > 0) {
            playingField.clear();
            for (Player player : players) {
                System.out.println(player + "'s turn!");
                player.showDeck();
                Card card = player.askForCard();
                while (!GameLogic.isCardAllowed(player, card, playingField)) {
                    player.giveCard(card);
                    player.showDeck();
                    card = player.askForCard();
                }
                playingField.put(player, card);
            }
            printPlayingField();
            checkForRoundWin();
            --cards_left;
        }
        // once all cards are gone, update all the player's points
        GameLogic.updatePlayerPoints(current_round, players);

        displayRoundResults();
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
        Player round_winning_player = (Player) highest_pair.getKey();
        System.out.println(round_winning_player + " won the round!");
        round_winning_player.addTrick();
        beginning_player = round_winning_player;
    }

    void displayRoundResults() {
        System.out.println("--------------------");
        System.out.println((current_round == 10 ? "End" : "Round") + " results:");
        System.out.println("--------------------");
        for (Player player : players) {
            System.out.println(player + ": " + player.getPoints()
                    + " Points (" + (player.getLastPointChange() >= 0 ? "+" : "")
                    + player.getLastPointChange() + ")");
        }
        if (current_round == 10) {
            Iterator it = players.iterator();
            ArrayList<Player> winning_players = new ArrayList<>();
            winning_players.add((Player) it.next());

            while (it.hasNext()) {
                Player next_player = (Player) it.next();
                if (next_player.getPoints() > winning_players.get(0).getPoints()) {
                    winning_players.clear();
                    winning_players.add(next_player);
                } else if (next_player.getPoints() == winning_players.get(0).getPoints()) {
                    winning_players.add(next_player);
                }
            }

            switch (winning_players.size()) {
                case 1: // just one winner
                    System.out.println(winning_players.get(0) + " won!");
                    break;
                default: // multiple winners (same amount of points)
                    System.out.println("Multiple wins!");
                    for (int i = 0; i < winning_players.size(); ++i) {
                        System.out.print(winning_players.get(i)
                                + (i == winning_players.size() - 1 ? " have won!" : " and "));
                    }
            }
        }
    }

    private class CardStock {
        private ArrayList<Card> game_cards, game_cards_deepcopy;

        CardStock() {
            game_cards_deepcopy = new ArrayList<>();

            // 5 Pirates
            for (int i = 0; i < 5; ++i)
                game_cards_deepcopy.add(new PirateCard());

            // 5 Escapes
            for (int i = 0; i < 5; ++i)
                game_cards_deepcopy.add(new EscapeCard());

            // 2 Mermaids
            for (int i = 0; i < 2; ++i)
                game_cards_deepcopy.add(new MermaidCard());

            // 1 ScaryMary
            game_cards_deepcopy.add(new ScaryMaryCard());

            // 1 SkullKing
            game_cards_deepcopy.add(new SkullKingCard());

            // Colored Cards
            CardColor[] cardColors = {CardColor.BLUE, CardColor.RED, CardColor.YELLOW, CardColor.BLACK};
            for (CardColor cardColor : cardColors) {
                int card_number = NumberCard.MIN_CARD_VALUE;
                while (card_number <= NumberCard.MAX_CARD_VALUE) {
                    game_cards_deepcopy.add(new NumberCard(cardColor, card_number));
                    ++card_number;
                }
            }
        }

        void createNewCardStock() {
            game_cards = new ArrayList<>(game_cards_deepcopy);
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
