import "./setup";
import {
  mergeFoodSuggestions,
  rankOpenFoodFactsResults,
  type OpenFoodFactsHit,
} from "../utils/openFoodSearch";

describe("rankOpenFoodFactsResults", () => {
  it("prefers US products when foreign products also match", () => {
    const hits: OpenFoodFactsHit[] = [
      {
        product_name: "Moo Milk chocolate flavoured",
        brands: "Moo Milk",
        countries_tags: ["en:united-kingdom"],
      },
      {
        product_name: "2% milk",
        brands: "Great Value",
        countries_tags: ["en:united-states"],
      },
      {
        product_name: "Homogenized Milk",
        brands: "California sunshine",
        countries_tags: ["en:thailand"],
      },
    ];

    expect(rankOpenFoodFactsResults(hits, "milk")).toEqual([
      {
        name: "2% milk",
        brand: "Great Value",
        quantity: undefined,
        imageUrl: undefined,
      },
    ]);
  });

  it("pushes exact multi-word matches above loose partial matches", () => {
    const hits: OpenFoodFactsHit[] = [
      {
        product_name: "Ritz crackers crunchy cream sandwich cheese",
        brands: "Ritz Crackers",
        countries_tags: ["en:cambodia"],
      },
      {
        product_name: "Ritz Crackers",
        brands: "Ritz",
        countries_tags: ["en:united-states"],
      },
      {
        product_name: "Ritz peanut butter crackers",
        brands: "Ritz",
        countries_tags: ["en:united-states"],
      },
    ];

    expect(rankOpenFoodFactsResults(hits, "ritz crackers")).toEqual([
      {
        name: "Ritz Crackers",
        brand: "Ritz",
        quantity: undefined,
        imageUrl: undefined,
      },
      {
        name: "Ritz peanut butter crackers",
        brand: "Ritz",
        quantity: undefined,
        imageUrl: undefined,
      },
    ]);
  });

  it("falls back to non-US results when there are no strong US matches", () => {
    const hits: OpenFoodFactsHit[] = [
      {
        product_name: "President Cheddar Cheese",
        brands: "President",
        countries_tags: ["en:turkey"],
      },
      {
        product_name: "Cheddar slices",
        brands: "Store Brand",
        countries_tags: ["en:canada"],
      },
    ];

    expect(rankOpenFoodFactsResults(hits, "cheddar cheese")).toEqual([
      {
        name: "President Cheddar Cheese",
        brand: "President",
        quantity: undefined,
        imageUrl: undefined,
      },
    ]);
  });
});

describe("mergeFoodSuggestions", () => {
  it("appends new suggestions without duplicating name and brand pairs", () => {
    expect(
      mergeFoodSuggestions(
        [
          { name: "Ritz Crackers", brand: "Ritz", quantity: "13.7 oz" },
          { name: "Cheddar Cheese", brand: "Tillamook" },
        ],
        [
          { name: "Ritz crackers", brand: "Ritz" },
          { name: "Greek Yogurt", brand: "Chobani" },
        ],
      ),
    ).toEqual([
      { name: "Ritz Crackers", brand: "Ritz", quantity: "13.7 oz" },
      { name: "Cheddar Cheese", brand: "Tillamook" },
      { name: "Greek Yogurt", brand: "Chobani" },
    ]);
  });
});
