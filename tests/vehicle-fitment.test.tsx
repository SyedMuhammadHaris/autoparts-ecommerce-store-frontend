import { renderWithQuery as render } from "./helpers/render";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { VehicleSelector } from "@/components/vehicle-selector";
import { ProductOption } from "@/components/product-option";
import AdminPage from "@/app/admin/page";
import { apiRequest } from "@/lib/api";
jest.mock("@/lib/api", () => {
  const actual = jest.requireActual("@/lib/api");
  const { apiPath } = jest.requireActual("@/lib/api/contracts");
  const request = jest.fn();
  return { ...actual, apiRequest: request,
    clientFetch: (options: import("@/lib/api/contracts").ApiOptions) => request(apiPath(options)),
    apiAction: (options: import("@/lib/api/contracts").ApiAction) => request(apiPath(options), options.method, options.payload),
  };
});
const request = apiRequest as jest.Mock;
const vehicle = { id: 1, model: 10, make: 1, make_name: "Toyota", model_name: "Corolla", year_start: 2014, year_end: 2018, engine: "1.8", trim: "Grande" };
const makes = [{ id: 1, name: "Toyota", slug: "toyota" }, { id: 2, name: "Honda", slug: "honda" }];
const models = [{ id: 10, make: 1, make_name: "Toyota", name: "Corolla", slug: "corolla" }];
const empty = { make: "", model: "", year: "", engine: "", trim: "" };
beforeEach(() => request.mockReset());
it("loads dependent vehicle options and clears model/year when make changes", async () => {
  request.mockImplementation((path: string) => Promise.resolve({ results: path.includes("vehicle-models") ? path.includes("make=1") ? models : [{ ...models[0], id: 20, make: 2, name: "Civic" }] : [vehicle], next: null }));
  render(<VehicleSelector makes={makes} models={[]} fitments={[]} initial={empty} />);
  expect(screen.getByLabelText("Vehicle model")).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Vehicle make"), { target: { value: "1" } });
  await screen.findByRole("option", { name: "Corolla" });
  fireEvent.change(screen.getByLabelText("Vehicle model"), { target: { value: "10" } });
  await screen.findByRole("option", { name: "2018" });
  fireEvent.change(screen.getByLabelText("Vehicle year"), { target: { value: "2016" } });
  expect(screen.getByRole("option", { name: "1.8" })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Vehicle make"), { target: { value: "2" } });
  expect(screen.getByLabelText("Vehicle model")).toHaveValue("");
  expect(screen.getByLabelText("Vehicle year")).toHaveValue("");
  await screen.findByRole("option", { name: "Civic" });
  expect(screen.queryByRole("option", { name: "Corolla" })).not.toBeInTheDocument();
});
it("keeps selected vehicle values on a filtered page and reports lookup failures", async () => {
  request.mockRejectedValue(new Error("private-diagnostic"));
  render(<VehicleSelector makes={makes} models={models} fitments={[vehicle]} initial={{ ...empty, make: "1", model: "10", year: "2016" }} />);
  expect(screen.getByLabelText("Vehicle year")).toHaveValue("2016");
  expect(await screen.findByRole("alert")).not.toHaveTextContent("private-diagnostic");
});
it("shows variant-specific fitment and never labels unknown compatibility universal", () => {
  render(<ProductOption variants={[
    { id: 1, sku: "SPECIFIC", price: "100", quantity_available: 1, values: [], fitment_status: "specific", fitments: [vehicle] },
    { id: 2, sku: "UNKNOWN", price: "200", quantity_available: 1, values: [], fitment_status: "unknown", fitments: [] },
    { id: 3, sku: "UNIVERSAL", price: "300", quantity_available: 1, values: [], fitment_status: "universal", fitments: [] },
  ]} />);
  expect(screen.getByText(/Toyota Corolla/)).toHaveTextContent("2014–2018");
  fireEvent.change(screen.getByLabelText("Product option"), { target: { value: "2" } });
  expect(screen.getByText(/Compatibility not recorded/)).toBeInTheDocument();
  expect(screen.queryByText(/Universal fit —/)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Product option"), { target: { value: "3" } });
  expect(screen.getByText(/Universal fit —/)).toBeInTheDocument();
});
it("offers fitment administration only with the corresponding permissions", async () => {
  request.mockImplementation((path: string) => Promise.resolve(path === "/api/account/me" ? { user: { is_staff: true, is_superuser: false, permissions: ["catalog.view_vehiclemake", "catalog.add_vehiclemake"] } } : { results: [], next: null }));
  render(<AdminPage />);
  await waitFor(() => expect(screen.getByText("No records yet.")).toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Vehicle makes" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Product fitments" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Toyota" } });
  fireEvent.change(screen.getByLabelText("URL slug"), { target: { value: "toyota" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(request).toHaveBeenCalledWith("/api/admin/vehicle-makes", "POST", { name: "Toyota", slug: "toyota", is_active: true }));
});
