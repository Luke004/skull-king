import cards.Card;

import java.util.ArrayList;
import java.util.Scanner;

public class Player {
    Scanner reader = new Scanner(System.in);  // Reading from System.in
    private ArrayList<Card> deck;
    private boolean hasFinishedTurn;
    private String name;
    private int bet;

    Player(String name) {
        deck = new ArrayList<>();
        hasFinishedTurn = false;
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

    void askForBet() {
        System.out.print("How many tricks are you going to make? [0-" + deck.size() + "]");
        int bet_input = reader.nextInt();
        setBet(bet_input);
    }

    Card askForCard(){
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

    Card playCard(int card_index) {
        Card card = deck.get(card_index);
        deck.remove(card_index);
        return card;
    }

    boolean hasCards(){
        return deck.size() != 0;
    }

    @Override
    public String toString() {
        return this.name;
    }
}
