package cards;

public class SkullKingCard extends Card implements CardType{

    @Override
    public String toString() {
        return "SK";
    }

    @Override
    public String type() {
        return "SkullKing";
    }
}
