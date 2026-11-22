import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithQuery as render } from "./helpers/render";
import { ReviewForm } from "@/features/reviews/review-form";
import { ProductReviews } from "@/features/reviews/product-reviews";
import { ReviewModerationForm } from "@/features/reviews/review-moderation-form";
import { apiAction, clientFetch } from "@/lib/api";

jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), apiAction: jest.fn(), clientFetch: jest.fn() }));
beforeEach(() => { (apiAction as jest.Mock).mockReset(); (clientFetch as jest.Mock).mockReset(); });
it("validates rating and submits public fields only for moderation", async () => {
  (apiAction as jest.Mock).mockResolvedValue({});
  render(<ReviewForm slug="test-part" review={null} />);
  fireEvent.change(screen.getByLabelText("Review title"), { target: { value: "Correct fit" } });
  fireEvent.change(screen.getByLabelText("Your review"), { target: { value: "Test review text" } });
  fireEvent.click(screen.getByRole("button", { name: "Submit review for moderation" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Choose a rating");
  fireEvent.change(screen.getByLabelText("Rating"), { target: { value: "5" } });
  fireEvent.click(screen.getByRole("button", { name: "Submit review for moderation" }));
  await waitFor(() => expect(apiAction).toHaveBeenCalledWith(expect.objectContaining({ method: "POST", payload: { display_name: "Verified purchaser", rating: 5, title: "Correct fit", body: "Test review text" } })));
});
it("does not load a private review for an anonymous visitor", async () => {
  (clientFetch as jest.Mock).mockImplementation(({ path }: { path: string }) => path === "/api/account/me" ? Promise.reject(new Error("Sign in")) : Promise.resolve({ count: 0, results: [], average: null, next: null, previous: null }));
  render(<ProductReviews slug="test-part" />);
  expect(await screen.findByText("0 published reviews")).toBeInTheDocument();
  expect((clientFetch as jest.Mock).mock.calls.some(([options]) => options.path.endsWith("/mine"))).toBe(false);
});
it("sends the reviewed revision with a staff decision", async () => {
  (apiAction as jest.Mock).mockResolvedValue({});
  render(<ReviewModerationForm selected={{ id: 1, revision: 3, title: "Test", body: "Text", rating: 5 }} onSaved={jest.fn().mockResolvedValue(undefined)} />);
  fireEvent.change(screen.getByLabelText("Customer-facing moderation note"), { target: { value: "Reviewed this revision" } });
  fireEvent.click(screen.getByRole("button", { name: "Record review moderation" }));
  await waitFor(() => expect(apiAction).toHaveBeenCalledWith(expect.objectContaining({ payload: { revision: 3, status: "rejected", note: "Reviewed this revision" } })));
});
