package cards;

public class ScaryMaryCard extends Card implements CardType{

    @Override
    public String toString() {
        return "SM";
    }

    @Override
    public String type() {
        return "ScaryMary";
    }
}
