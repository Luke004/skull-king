package cards;

public class MermaidCard extends Card implements CardType {

    @Override
    public String toString() {
        return "ME";
    }

    @Override
    public String type() {
        return "Mermaid";
    }
}
