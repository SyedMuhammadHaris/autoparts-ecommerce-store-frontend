import { act, render, screen } from "@testing-library/react";
import { toast } from "react-toastify";
import { ToastHost } from "@/components/toast-host";
import { notifySuccess, notifyError, clearNotifications } from "@/lib/notifications";
import { ApiError } from "@/lib/api/contracts";

afterEach(() => { clearNotifications(); jest.restoreAllMocks(); });
it("renders an accessible success toast once for duplicate messages", async () => {
  render(<ToastHost />);
  act(() => { notifySuccess("Saved successfully."); notifySuccess("Saved successfully."); });
  expect(await screen.findByRole("status")).toHaveTextContent("Saved successfully.");
  expect(screen.getByRole("region", { name: "Notifications" })).toBeInTheDocument();
  expect(screen.getAllByText("Saved successfully.")).toHaveLength(1);
});
it("shows actionable validation errors and keeps errors open until dismissed", async () => {
  const error = jest.spyOn(toast, "error");
  render(<ToastHost />);
  act(() => notifyError(new ApiError("Invalid request.", 400, { email: ["Enter a valid email."] })));
  expect(await screen.findByRole("alert")).toHaveTextContent("Enter a valid email.");
  expect(error).toHaveBeenCalledWith("Enter a valid email.", expect.objectContaining({ autoClose: false }));
});
it("never shows arbitrary exception details and ignores aborted requests", async () => {
  render(<ToastHost />);
  act(() => { notifyError(new Error("private-token-or-diagnostic")); notifyError(new DOMException("aborted", "AbortError")); });
  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to connect. Please try again.");
  expect(screen.queryByText(/private-token-or-diagnostic/)).not.toBeInTheDocument();
  expect(screen.getAllByRole("alert")).toHaveLength(1);
});
it("clears active and queued notifications when authentication changes", () => {
  const dismiss = jest.spyOn(toast, "dismiss");
  const clear = jest.spyOn(toast, "clearWaitingQueue");
  render(<ToastHost />);
  act(() => window.dispatchEvent(new Event("auth-changed")));
  expect(dismiss).toHaveBeenCalledTimes(1); expect(clear).toHaveBeenCalledTimes(1);
});
