from pathlib import Path
import textwrap

PAGE_WIDTH = 842
PAGE_HEIGHT = 595
MARGIN_X = 34
TOP_Y = 485
COLUMN_GAP = 22
COLUMN_COUNT = 4
COLUMN_WIDTH = (PAGE_WIDTH - (MARGIN_X * 2) - (COLUMN_GAP * (COLUMN_COUNT - 1))) / COLUMN_COUNT

INK = (0.09, 0.22, 0.19)
SOFT = (0.33, 0.41, 0.38)
SEA = (0.06, 0.49, 0.53)
CORAL = (0.85, 0.46, 0.41)
SUN = (0.96, 0.72, 0.38)
PAPER = (0.98, 0.96, 0.92)
LINE = (0.88, 0.80, 0.72)

FOOD_COLUMNS = [
    [
        {
            "title": "Eggs",
            "intro": "Served with toast and butter.",
            "items": [
                ("2 scrambled or fried eggs", "4,60", None),
                ("Omelette (3 eggs)", "5,20", "Extra ham, cheese, mushrooms, tomato, bacon or onions +0,60."),
            ],
        },
        {
            "title": "Toasts",
            "intro": "Gluten-free bread +1,50. Integral bread +1,00.",
            "items": [
                ("Toasts with chopped tomato", "3,40", "Finished with olive oil."),
                ("Ham & cheese sandwich", "4,00", "Extra tomato or onions +0,50."),
                ("Avocado toasts", "6,00", None),
                ("Salmon toasts", "7,00", "Smoked salmon, cream cheese and onions."),
                ("Italian toasts", "6,50", "Avocado, tomato, cucumber, mozzarella, pesto sauce and olive oil."),
                ("Energy toasts", "6,50", "Peanut butter, banana, almond, honey and cocoa."),
                ("Cabria toasts", "6,90", "Goat cheese, rocket and cherry jam."),
                ("Omega toasts", "7,00", "Avocado, salmon, rocket, lemon and olive oil."),
            ],
        },
        {
            "title": "Smoothie Bowls",
            "intro": "All bowls include homemade granola, fresh and dried fruits.",
            "items": [
                ("Morning magic", "9,00", "Mango, strawberries, banana and orange juice."),
                ("Forever Young", "9,00", "Avocado, arugula, banana, apple, dates, honey and apple juice."),
                ("Choco Greedy", "9,00", "Banana, cocoa, peanut butter, dates and almond milk. Served in a coco bowl."),
            ],
        },
        {
            "title": "Sweets",
            "items": [
                ("Brownie with vanilla ice cream", "5,00", None),
                ("Cheese cake", "5,00", None),
                ("Nutella waffle", "5,00", None),
                ("Whipped cream / fruits waffle", "5,00", None),
                ("Lemon tart", "5,00", None),
            ],
        },
    ],
    [
        {
            "title": "Breakfasts",
            "items": [
                ("English breakfast", "8,50", "2 scrambled or fried eggs, 2 sausages, bacon, roasted tomatoes, mushrooms, beans, hashbrown potato, toasts, butter and jam."),
                ("Sweety breakfast", "7,90", "6 mini pancakes, agave syrup, Nutella and fresh fruit salad."),
                ("Vitality breakfast", "7,90", "Yogurt, homemade granola, fresh fruit salad and avocado toast."),
                ("Mini brunch", "9,20", "Scrambled eggs, bacon, toast, yogurt, granola, fresh fruits, 2 mini pastries and pancakes with agave syrup."),
                ("Moroccan breakfast", "6,90", "2 scrambled or fried eggs, Moroccan bread, cheese, olive oil, honey, black and green olives."),
                ("Continental breakfast", "6,90", "Croissant, toasted bread, butter and jam, plus a small fresh fruit salad."),
            ],
        },
        {
            "title": "Burgers & Sandwiches",
            "intro": "Served with french fries.",
            "items": [
                ("Miami burger", "10,90", "100 percent beef, lettuce, tomato, cheese, caramelized onions, ketchup and BBQ sauce."),
                ("Chicken burger", "10,90", "Chicken, lettuce, tomato, cheese, onions, cocktail sauce and BBQ sauce."),
                ("Croque-Monsieur", "8,90", "Toasted bread, ham, Emmental cheese and bechamel sauce. Add a fried egg for +0,60."),
                ("Croque-Salmon", "10,20", "Toasted bread, spinach, smoked salmon, bechamel sauce and Emmental cheese."),
                ("Club Sandwich Royal", "10,50", "Toasted sandwich bread, ham, mayonnaise, egg, cucumber, tomato and lettuce."),
                ("Veggie club sandwich", "10,50", "Toasted sandwich bread, avocado, lettuce, cucumber, tomato, mozzarella and pesto sauce."),
            ],
        },
    ],
    [
        {
            "title": "Poke Bowls & Salads",
            "items": [
                ("Aloha Bowl", "11,90", "Rice or quinoa with salmon teriyaki, carrots, mango, avocado, cucumber, edamame, sesame seeds, soy sauce and spicy mayonnaise."),
                ("Japanese Bowl", "11,70", "Rice or quinoa with chicken teriyaki, carrots, tomato, avocado, cucumber, red cabbage, peanuts and soy sauce."),
                ("Caesar salad", "10,50", "Salad, grilled chicken, croutons, parmesan cheese and Caesar sauce. Served with toasted bread."),
                ("Balboa salad", "11,90", "Salad, shrimps, smoked salmon, avocado, tomato, carrots, cucumber, black olives, sesame seeds and house dressing. Served with toasted bread."),
                ("Niza salad", "11,90", "Salad, tomato, cucumber, egg, artichoke, green pepper, onions, tuna, anchovy, black olives and homemade dressing. Served with toasted bread."),
            ],
        },
    ],
    [
        {
            "title": "Vegan Club",
            "items": [
                ("Vegan omelette", "7,00", "Vegan omelette with mushrooms and onions. Served with rocket and tomatoes."),
                ("Healthy toasts", "6,50", "Hummus, tomato, cucumber, carrots and sesame seeds."),
                ("Green toasts", "6,90", "Avocado, cucumber, pesto, rocket and edamame."),
                ("Mini vegan brunch", "9,20", "Vegan omelette, toast, banana pancakes, agave syrup, vegetal yogurt, granola, fresh fruits and 2 mini vegan pastries."),
                ("Rainbow bowl", "11,50", "Rice or quinoa, carrots, red cabbage, cucumber, tomatoes, avocado, cashew nuts, grilled chickpeas, hummus and soy sauce."),
                ("Grilled vegetables salad", "10,90", "Lettuce, grilled vegetables, tomato, croutons, onions, toasted almonds and homemade pesto dressing. Served with toasted bread."),
                ("Falafels salad", "11,50", "Falafels, lettuce, tomatoes, cucumber, avocado, red onions and homemade dressing."),
                ("Summer salad", "10,90", "Lettuce, mango, kiwi, avocado, pomegranate, red onions, toasted almonds, mint and lemon dressing. Served with toasted bread."),
                ("Vegan burger", "10,90", "Vegan meat, tomato, lettuce, onions, avocado and ketchup. Served with french fries."),
            ],
        },
        {
            "title": "Pizza",
            "items": [
                ("Pizza peperoni", "9,30", "Tomato sauce, peperoni and mozzarella cheese."),
                ("Pizza Reina", "9,70", "Tomato sauce, ham, mozzarella, mushrooms and black olives."),
                ("Pizza primavera", "9,30", "Tomato sauce, mozzarella, vegetables and black olives."),
            ],
        },
        {
            "title": "Kids Menu",
            "items": [
                ("Spaghetti with tomato sauce", "6,50", None),
                ("Chicken nuggets", "6,90", "Served with french fries."),
                ("Kid poke bowl", "6,90", "Rice, chicken, carrots, tomato, cucumber, edamame and soy sauce."),
            ],
        },
    ],
]

DRINK_COLUMNS = [
    [
        {
            "title": "Whisky",
            "items": [
                ("J&B", "6,00", None),
                ("Ballantine's", "6,00", None),
                ("DYC", "6,00", None),
                ("Teacher's", "6,00", None),
                ("The Famous Grouse", "6,50", None),
                ("Dewar's White Label", "6,50", None),
                ("Johnny Walker Red Label", "7,00", None),
                ("Jack Daniel's", "7,00", None),
                ("Maker's Mark", "7,50", None),
                ("Gentleman Jack", "9,00", None),
                ("Chivas Regal 12", "9,50", None),
            ],
        },
        {
            "title": "Vodka",
            "items": [
                ("Absolut", "6,00", None),
                ("Smirnoff", "6,50", None),
                ("Ciroc", "8,50", None),
                ("Greygoose", "9,50", None),
            ],
        },
        {
            "title": "Gin",
            "items": [
                ("Larios", "6,00", None),
                ("Larios 12", "6,00", None),
                ("Beefeater", "6,50", None),
                ("Gordon's", "6,50", None),
                ("Bombay Sapphire", "7,00", None),
                ("Tanqueray", "7,00", None),
                ("Tanqueray Flor de Sevilla", "7,00", None),
                ("Tanqueray Ten", "8,50", None),
            ],
        },
    ],
    [
        {
            "title": "Signature Cocktails",
            "items": [
                ("Club del Mar", "8,00", "White rum, blue curacao, coconut cream and pineapple juice."),
                ("Mojito", "7,50", "White rum, brown sugar, lime, soda and fresh mint."),
                ("Mojito de Fresa", "7,50", "White rum, strawberry, lime, mint and soda."),
                ("Coeur de Mel", "7,00", "Cointreau, strawberry syrup and prosecco."),
                ("Daiquiri (frozen)", "7,50", "White rum, lime juice, sugar and fruit liqueur."),
                ("Daiquiri de Fresa", "7,50", "White rum, strawberry, lime juice and strawberry liqueur."),
                ("Mai Tai", "8,00", "Dark rum, white rum, triple sec, orgeat syrup, lime and orange."),
                ("Pina colada", "7,50", "White rum, coconut cream and pineapple juice."),
                ("Blue lagoon", "7,00", "Vodka, blue curacao, lemonade and lime juice."),
                ("Porn star", "7,50", "Vodka, passion fruit, vanilla syrup and prosecco."),
                ("Mystery", "7,50", "White rum, gin, peach liqueur, pomegranate syrup and pineapple juice."),
                ("AGP Costa del Sol", "7,50", "Dark rum, passion fruit, vanilla and lime."),
            ],
        },
    ],
    [
        {
            "title": "Classics",
            "items": [
                ("Cosmopolitan", "7,00", None),
                ("Margarita", "7,00", None),
                ("Bloody Mary", "7,00", None),
                ("Sex on the beach", "7,00", None),
                ("Tequila sunrise", "7,00", None),
                ("Long Island ice tea", "8,00", None),
                ("Espresso Martini", "7,50", None),
                ("Sangria", "7,00", None),
                ("Aperol Spritz", "7,00", None),
                ("Cuba libre", "7,00", None),
                ("Caipirinha", "7,00", None),
                ("Gin fizz", "7,00", None),
                ("Gin tonic", "7,00", None),
            ],
        },
        {
            "title": "Alcohol-Free",
            "items": [
                ("Virgin mojito", "5,90", None),
                ("Virgin pina colada", "5,90", None),
                ("Bora Bora", "5,90", "Passion fruit, pineapple, lemon and grenadine."),
            ],
        },
    ],
    [
        {
            "title": "Rum",
            "items": [
                ("Bacardi", "6,00", None),
                ("Brugal", "6,50", None),
                ("Barcelo", "6,00", None),
                ("Pampero", "6,00", None),
                ("Centenario", "6,50", None),
                ("Flor de Cana", "6,50", None),
                ("Havana Club", "7,50", None),
                ("Matusalem", "7,50", None),
                ("Abuelo 7 anos", "8,00", None),
                ("Zacapa 23", "12,50", None),
            ],
        },
        {
            "title": "Liqueurs",
            "items": [
                ("Limoncello", "4,00", None),
                ("Marie Brizard", "4,00", None),
                ("Ruavieja", "4,00", None),
                ("Cointreau", "4,00", None),
                ("Ricard", "4,00", None),
                ("Malibu", "4,00", None),
                ("Martini", "4,00", None),
                ("Jagermeister", "4,00", None),
                ("Baileys", "4,00", None),
                ("Liqueur with soft drink or juice", "5,50", None),
            ],
        },
        {
            "title": "Soft Drinks",
            "items": [
                ("Water (0.5L)", "1,50", None),
                ("Sparkling water (0.5L)", "1,50", None),
                ("Soft drink", "2,00", None),
                ("Tonic water", "2,50", None),
                ("Orange juice", "3,20", None),
                ("Bottled juice", "2,00", None),
                ("Red Bull", "3,20", None),
            ],
        },
        {
            "title": "Milkshakes & Smoothies",
            "items": [
                ("Club del Mar milkshake", "4,90", "House-made with cream, milk and ice cream. Ask for strawberry, Nutella, Oreo or banana."),
                ("Yellow smoothie", "4,50", "Banana, mango, pineapple and coconut milk."),
                ("Purple smoothie", "4,90", "Strawberry, banana, yogurt and pomegranate juice."),
            ],
        },
    ],
]


def escape_pdf_text(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def wrap_text(text: str, font_size: float, width: float) -> list[str]:
    chars = max(22, int(width / (font_size * 0.52)))
    return textwrap.wrap(text, width=chars)


def line_height(font_size: float, factor: float = 1.28) -> float:
    return font_size * factor


def text_width(text: str, font_size: float, factor: float = 0.52) -> float:
    return len(text) * font_size * factor


def set_fill(commands: list[str], color: tuple[float, float, float]) -> None:
    commands.append(f"{color[0]:.3f} {color[1]:.3f} {color[2]:.3f} rg")


def set_stroke(commands: list[str], color: tuple[float, float, float], width: float = 1) -> None:
    commands.append(f"{color[0]:.3f} {color[1]:.3f} {color[2]:.3f} RG")
    commands.append(f"{width:.2f} w")


def draw_rect(commands: list[str], x: float, y: float, w: float, h: float, color: tuple[float, float, float]) -> None:
    set_fill(commands, color)
    commands.append(f"{x:.2f} {y:.2f} {w:.2f} {h:.2f} re f")


def draw_line(commands: list[str], x1: float, y1: float, x2: float, y2: float, color: tuple[float, float, float], width: float = 1) -> None:
    set_stroke(commands, color, width)
    commands.append(f"{x1:.2f} {y1:.2f} m {x2:.2f} {y2:.2f} l S")


def draw_text(commands: list[str], x: float, y: float, text: str, font: str, size: float, color: tuple[float, float, float]) -> None:
    set_fill(commands, color)
    commands.append("BT")
    commands.append(f"/{font} {size:.2f} Tf")
    commands.append(f"1 0 0 1 {x:.2f} {y:.2f} Tm")
    commands.append(f"({escape_pdf_text(text)}) Tj")
    commands.append("ET")


def draw_wrapped(commands: list[str], x: float, y: float, text: str, font: str, size: float, color: tuple[float, float, float], width: float) -> float:
    for line in wrap_text(text, size, width):
        draw_text(commands, x, y, line, font, size, color)
        y -= line_height(size, 1.2)
    return y


def draw_category(commands: list[str], category: dict, x: float, start_y: float, width: float) -> float:
    y = start_y
    draw_text(commands, x, y, category["title"], "F3", 15.5, CORAL)
    y -= 18

    intro = category.get("intro")
    if intro:
        y = draw_wrapped(commands, x, y, intro, "F1", 7.4, SOFT, width - 4)
        y -= 6

    for name, price, desc in category["items"]:
        draw_text(commands, x, y, name, "F2", 8.8, INK)
        price_x = x + width - text_width(price, 8.8, 0.5)
        draw_text(commands, price_x, y, price, "F2", 8.8, CORAL)
        y -= 11
        if desc:
            y = draw_wrapped(commands, x, y, desc, "F1", 7.2, SOFT, width - 4)
        y -= 5

    return y - 8


def build_page(title: str, subtitle: str, page_number: int, columns: list[list[dict]]) -> str:
    commands: list[str] = []

    draw_rect(commands, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, PAPER)
    draw_rect(commands, 0, PAGE_HEIGHT - 78, PAGE_WIDTH, 78, (0.99, 0.95, 0.89))
    draw_rect(commands, 0, PAGE_HEIGHT - 6, PAGE_WIDTH, 6, CORAL)
    draw_rect(commands, 0, PAGE_HEIGHT - 12, PAGE_WIDTH, 6, SUN)

    draw_text(commands, MARGIN_X, PAGE_HEIGHT - 48, "Club del Mar", "F3", 28, SEA)
    draw_text(commands, MARGIN_X, PAGE_HEIGHT - 68, title, "F2", 13, CORAL)
    draw_text(commands, MARGIN_X + 190, PAGE_HEIGHT - 68, subtitle, "F1", 9, SOFT)
    draw_text(commands, PAGE_WIDTH - 90, PAGE_HEIGHT - 68, f"Page {page_number}", "F2", 9, SOFT)
    draw_line(commands, MARGIN_X, PAGE_HEIGHT - 88, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 88, LINE, 1)

    for divider in range(1, COLUMN_COUNT):
        x = MARGIN_X + (divider * (COLUMN_WIDTH + COLUMN_GAP)) - (COLUMN_GAP / 2)
        draw_line(commands, x, 72, x, PAGE_HEIGHT - 102, LINE, 0.8)

    for index, column in enumerate(columns):
        x = MARGIN_X + (index * (COLUMN_WIDTH + COLUMN_GAP))
        y = TOP_Y
        for category in column:
            y = draw_category(commands, category, x, y, COLUMN_WIDTH)

    draw_text(
        commands,
        MARGIN_X,
        30,
        "Typed from the supplied Club Del Mar menu references. Designed as a clean text-first PDF.",
        "F1",
        8,
        SOFT,
    )

    return "\n".join(commands)


def stream_object(content: str) -> str:
    content_bytes = content.encode("latin-1")
    return f"<< /Length {len(content_bytes)} >>\nstream\n{content}\nendstream"


def build_pdf(page_contents: list[str]) -> bytes:
    objects: list[str] = []

    def add_object(value: str) -> int:
        objects.append(value)
        return len(objects)

    font_regular = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    font_bold = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
    font_italic = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic >>")

    page_ids: list[int] = []
    content_ids: list[int] = []

    for content in page_contents:
        page_ids.append(add_object(""))
        content_ids.append(add_object(stream_object(content)))

    pages_id = add_object("")
    catalog_id = add_object("")

    resources = f"<< /Font << /F1 {font_regular} 0 R /F2 {font_bold} 0 R /F3 {font_italic} 0 R >> >>"

    for page_id, content_id in zip(page_ids, content_ids):
        objects[page_id - 1] = (
            f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] "
            f"/Resources {resources} /Contents {content_id} 0 R >>"
        )

    kids = " ".join(f"{page_id} 0 R" for page_id in page_ids)
    objects[pages_id - 1] = f"<< /Type /Pages /Count {len(page_ids)} /Kids [{kids}] >>"
    objects[catalog_id - 1] = f"<< /Type /Catalog /Pages {pages_id} 0 R >>"

    pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]

    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode("latin-1"))
        pdf.extend(obj.encode("latin-1"))
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    pdf.extend(b"0000000000 65535 f \n")

    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("latin-1"))

    pdf.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF"
        ).encode("latin-1")
    )

    return bytes(pdf)


def main() -> None:
    food_page = build_page("Food Menu", "Breakfast, bowls, burgers, pizza and sweets", 1, FOOD_COLUMNS)
    drinks_page = build_page("Drinks Menu", "Cocktails, spirits, soft drinks and smoothies", 2, DRINK_COLUMNS)
    pdf_bytes = build_pdf([food_page, drinks_page])

    output_path = Path(__file__).with_name("club-del-mar-menu.pdf")
    output_path.write_bytes(pdf_bytes)
    print(output_path)


if __name__ == "__main__":
    main()
