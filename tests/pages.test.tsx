import { fireEvent, render, screen } from "@testing-library/react";
import HomePage from "@/app/page";
import NotFound from "@/app/not-found";
import ErrorPage from "@/app/error";
import Loading from "@/app/loading";
import { SiteHeader } from "@/components/site-header";

it("communicates that ordering is not available yet", () => {
  render(<HomePage />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("The right part.");
  expect(screen.getByText("Automotive parts · Pakistan")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /explore parts/i })).toHaveAttribute("href", "/products");
});

it("provides a named home link", () => {
  render(<SiteHeader />);
  expect(screen.getByRole("link", { name: "Autoparts home" })).toHaveAttribute("href", "/");
});

it("offers a route home on missing pages", () => {
  render(<NotFound />);
  expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
});

it("retries a failed page without exposing the internal error", () => {
  const reset = jest.fn();
  render(<ErrorPage error={new Error("internal diagnostic")} reset={reset} />);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(reset).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("internal diagnostic")).not.toBeInTheDocument();
});

it("announces loading", () => {
  render(<Loading />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading");
});
