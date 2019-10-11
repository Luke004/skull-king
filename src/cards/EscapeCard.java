package cards;

public class EscapeCard extends Card implements CardType {

    @Override
    public String toString() {
        return "ES";
    }

    @Override
    public String type() {
        return "Escape";
    }
}
