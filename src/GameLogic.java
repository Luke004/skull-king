import cards.Card;
import cards.NumberCard;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.Map;

public class GameLogic {

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

    static boolean isCardAllowed(Card current_card, ArrayList<Card> cards) {
        return false;
    }
}
