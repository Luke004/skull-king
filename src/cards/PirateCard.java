package cards;

public class PirateCard extends Card implements CardType{

    @Override
    public String toString() {
        return "PI";
    }

    @Override
    public String type() {
        return "Pirate";
    }
}
