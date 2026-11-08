import { ChakraProvider } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { Carousel } from "./Carousel";

beforeAll(() => {
  // jsdom não implementa ResizeObserver
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("Carousel", () => {
  it("renderiza cada item e ignora valores nulos", () => {
    render(
      <ChakraProvider>
        <Carousel label="Séries">
          <span>A</span>
          {null}
          <span>B</span>
        </Carousel>
      </ChakraProvider>
    );

    expect(screen.getByRole("region", { name: "Séries" })).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});
