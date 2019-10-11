package cards;

public class NumberCard extends Card implements CardType {
    public static final int MAX_CARD_VALUE = 13, MIN_CARD_VALUE = 1;
    private CardColor color;
    private int number;

    public NumberCard(CardColor color, int number) {
        this.color = color;
        this.number = number;
    }

    public String getColor() {
        return color.name();
    }

    public int getNumber() {
        return number;
    }

    @Override
    public String toString() {
        String color_name;
        switch (color) {
            case RED:
                color_name = "RED ";
                break;
            case BLUE:
                color_name = "BLUE ";
                break;
            case YELLOW:
                color_name = "YELLOW ";
                break;
            case BLACK:
                color_name = "BLACK ";
                break;
            default:
                color_name = "UNDEFINED_COLOR ";
        }
        return color_name + number;
    }

    @Override
    public String type() {
        return "Number";
    }
}


