import cards.Card;
import cards.NumberCard;

import java.util.*;

public class GameLogic {

    static final int POINTS_PER_TRICK = 20;
    static final int POINTS_PER_ROUND_FOR_ZERO_BET = 10;
    static final int LOSS_PER_FALSE_BET = 10;

    static Map.Entry getHighestRankedPair(Map<Player, Card> playingField) {
        if (playingField.size() == 1) return playingField.entrySet().iterator().next();

        Iterator<Map.Entry<Player, Card>> iterator = playingField.entrySet().iterator();

        // take the first laid card as the highest card as a starting point
        Map.Entry highest_pair = iterator.next();
        Card highest_card = ((Card) highest_pair.getValue());

        // now look for the following cards and see if they are higher

        while (iterator.hasNext()) {
            Map.Entry current_pair = iterator.next();
            Card current_card = ((Card) current_pair.getValue());
            switch (current_card.type()) {
                case "Number":
                    switch (highest_card.type()) {
                        case "Pirate":
                        case "SkullKing":
                        case "Mermaid":
                            continue;
                        case "Escape":
                            highest_pair = current_pair;
                            continue;
                        case "Number":
                            String highest_card_color = ((NumberCard) highest_card).getColor();
                            String current_card_color = ((NumberCard) current_card).getColor();

                            // if the current card is black and the currently highest not, the current card
                            // will be the highest card
                            if (current_card_color.equals("BLACK")) {
                                if (!highest_card_color.equals("BLACK")) {
                                    highest_pair = current_pair;
                                    continue;
                                }
                            }

                            // if the currently highest card is black and the current card not, we can continue
                            if (highest_card_color.equals("BLACK")) {
                                if (!current_card_color.equals("BLACK")) {
                                    continue;
                                }
                            }

                            // both cards have the same color, so check for the values
                            if (highest_card_color.equals(current_card_color)) {
                                int highest_card_number = ((NumberCard) highest_card).getNumber();
                                int current_card_number = ((NumberCard) current_card).getNumber();
                                if (highest_card_number > current_card_number) continue;
                                else highest_pair = current_pair;
                            }
                    }
                    break;
                case "Pirate":
                    switch (highest_card.type()) {
                        case "Escape":
                        case "Number":
                        case "Mermaid":
                            highest_pair = current_pair;
                            continue;
                        case "Pirate":
                        case "SkullKing":
                            // the currently laid pirate is tricked by an already put skull king or pirate
                            continue;
                    }
                    break;
                case "Mermaid":
                    switch (highest_card.type()) {
                        case "Escape":
                        case "Number":
                            highest_pair = current_pair;
                            continue;
                        case "Pirate":
                        case "Mermaid":
                            // the currently laid mermaid is tricked by an already put pirate or mermaid
                            continue;
                        case "SkullKing":
                            // mermaid tricks the skull king, AWESOME!
                            highest_pair = current_pair;
                            continue;
                    }
                    break;
                case "Escape":
                    continue;
                case "SkullKing":
                    switch (highest_card.type()) {
                        case "Escape":
                        case "Number":
                        case "Pirate":
                            highest_pair = current_pair;
                            continue;
                        case "Mermaid":
                            // the currently laid skull king is tricked by a put mermaid, the was either extremely
                            // stupid or you knew what you did
                            continue;
                    }
                    break;
            }
        }
        return highest_pair;
    }

    static boolean isCardAllowed(Card chosen_card, Map<Player, Card> playingField) {
        // TODO
        /*
        Card color_to_confess = null;

        Iterator<Map.Entry<Player, Card>> iterator = playingField.entrySet().iterator();

        while (iterator.hasNext()) {
            Map.Entry next_card = iterator.next();
            Card highest_card = ((Card) highest_pair.getValue());
        }
        */



        return false;
    }

    static void updatePlayerPoints(int round, ArrayList<Player> players) {
        for (Player player : players) {
            if (player.getBet() == 0) {
                if (player.getTricks() == 0) {
                    // player has calculated a zero round right
                    // add points according to current round
                    int points = round * POINTS_PER_ROUND_FOR_ZERO_BET;
                    player.updatePoints(points);
                } else {
                    // player has calculated a zero round wrong
                    // remove points according to current round
                    int points = round * POINTS_PER_ROUND_FOR_ZERO_BET;
                    player.updatePoints(-points);
                }
            } else if (player.getBet() == player.getTricks()) {
                // player has calculated right, add the points
                int points = player.getTricks() * POINTS_PER_TRICK;
                player.updatePoints(points);
            } else {
                // player has calculated wrong, remove points
                // 'Math.abs' means always positive outcome of number
                int points = Math.abs(player.getTricks() - player.getBet()) * -LOSS_PER_FALSE_BET;
                player.updatePoints(points);
            }
        }
    }

    /*
    sort the player list starting with the beginning player
    followed by all other players maintaining the same order as it was before
     */
    static void sortPlayerList(ArrayList<Player> players, Player beginning_player) {
        for (Player player : players) {
            if (player.equals(beginning_player)) {
                int start_idx = players.indexOf(player);
                if (start_idx == 0) return;
                swapSubList(players, 0, start_idx - 1, start_idx, players.size() - 1);
            }
        }
    }

    private static <Player> void swapSubList(List<Player> list, int first1, int last1, int first2, int last2) {
        for (int i = first1, j = first2; i <= last1 || j <= last2; i++, j++) {
            if (i <= last1 && j <= last2) {
                Collections.swap(list, i, j);
            } else if (i > last1) {
                Player temp = list.remove(j);
                list.add(i, temp);
            } else {
                Player temp = list.remove(i);
                list.add(j, temp);
            }
        }
    }
}
