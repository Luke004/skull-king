import cards.Card;
import cards.EscapeCard;
import cards.NumberCard;
import cards.PirateCard;

import java.util.ArrayList;
import java.util.Scanner;

public class Player {
    Scanner reader = new Scanner(System.in);  // Reading from System.in
    private ArrayList<Card> deck;
    private String name;
    private int bet, tricks, points, possible_extra_points, last_point_change;

    Player(String name) {
        deck = new ArrayList<>();
        this.name = name;
    }

    void giveCard(Card card) {
        deck.add(card);
    }

    void showDeck() {
        System.out.println("Your Deck:");
        for (int i = 0; i < deck.size(); ++i) {
            System.out.print("[" + deck.get(i) + "]");
            if (i != deck.size() - 1) System.out.print(" ");
            else System.out.println();
        }
    }

    boolean hasColorCard(NumberCard colorCard) {
        for (Card card : deck) {
            if (!(card instanceof NumberCard)) continue;
            if (((NumberCard) card).getColor().equals(colorCard.getColor())) return true;
        }
        return false;
    }

    void askForBet() {
        System.out.print("How many tricks are you going to make? [0-" + deck.size() + "]");
        int bet_input = reader.nextInt();
        setBet(bet_input);
    }

    Card askForCard() {
        System.out.print("Choose a card ");
        if (deck.size() == 1) {
            System.out.print("[1]");
        } else {
            System.out.print("[1-" + deck.size() + "]");
        }
        int card_input = reader.nextInt();
        return playCard(card_input - 1);
    }

    void setBet(int bet) {
        this.bet = bet;
    }

    int getBet() {
        return bet;
    }

    void reset() {
        tricks = 0;
        possible_extra_points = 0;
    }

    Card playCard(int card_index) {
        Card card = deck.get(card_index);
        deck.remove(card_index);
        // handle the scary mary special case
        if (card.type().equals("ScaryMary")) {
            System.out.println("DECIDE: ScaryMary as Escape [0] or Pirate [1]?");
            int card_input = reader.nextInt();
            switch (card_input) {
                case 0: // scary mary is escape card
                    return new EscapeCard();
                case 1: // scary mary is pirate
                    return new PirateCard();
            }
        }
        return card;
    }

    void addTrick() {
        ++tricks;
    }

    int getTricks() {
        return tricks;
    }

    void addPossibleExtraPoints(int possible_extra_points) {
        this.possible_extra_points = possible_extra_points;
    }

    int getPossibleExtraPoints() {
        return possible_extra_points;
    }

    void updatePoints(int amount) {
        points += amount;
        last_point_change = amount;
    }

    int getPoints() {
        return points;
    }

    int getLastPointChange() {
        return last_point_change;
    }

    @Override
    public String toString() {
        return this.name;
    }
}
