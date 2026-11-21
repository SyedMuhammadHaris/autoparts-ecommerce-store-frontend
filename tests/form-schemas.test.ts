import { authSchema, checkoutSchema, otpSchema } from "@/lib/forms/schemas";
import { resourceSchema } from "@/features/admin/schemas";
import { resources } from "@/features/admin/resources";

it("normalizes names/email while preserving password characters", () => {
  expect(authSchema(true).parse({ name: " Customer ", email: " customer@example.invalid ", password: " password with spaces " })).toEqual({ name: "Customer", email: "customer@example.invalid", password: " password with spaces " });
  expect(authSchema(true).safeParse({ name: "", email: "bad", password: "short" }).success).toBe(false);
  expect(authSchema(false).safeParse({ name: "", email: "customer@example.invalid", password: "short" }).success).toBe(true);
});
it("requires six decimal OTP digits", () => {
  expect(otpSchema.safeParse({ code: "012345" }).success).toBe(true);
  for (const code of ["12345", "abcdef", "1234567"]) expect(otpSchema.safeParse({ code }).success).toBe(false);
});
it("rejects missing delivery choices and invalid contact details before checkout", () => {
  const value = { name: "Customer", email: "customer@example.invalid", phone: "+923001234567", line1: "Street 1", line2: "", postal_code: "", city: "1", shipping_rate: "2", payment_method: "cod" };
  expect(checkoutSchema.safeParse(value).success).toBe(true);
  expect(checkoutSchema.safeParse({ ...value, city: "", phone: "abc" }).success).toBe(false);
});
it("preserves explicit zero tax and treats a blank optional tax as unconfigured", () => {
  const resource = resources.find(value => value.key === "checkout-policies")!;
  const values = { name: "Local", tax_percent: "0", reservation_minutes: "30", cod_enabled: true, bank_transfer_enabled: false };
  expect(resourceSchema(resource, false).parse(values).tax_percent).toBe("0");
  expect(resourceSchema(resource, false).parse({ ...values, tax_percent: "" }).tax_percent).toBeNull();
  expect(resourceSchema(resource, false).safeParse({ ...values, tax_percent: "101" }).success).toBe(false);
});
it("rejects reversed year ranges and credential-bearing image URLs", () => {
  const years = resources.find(value => value.key === "vehicle-fitments")!;
  expect(resourceSchema(years, false).safeParse({ model: "1", year_start: "2020", year_end: "2010", engine: "", trim: "", is_active: true }).success).toBe(false);
  const images = resources.find(value => value.key === "images")!;
  expect(resourceSchema(images, false).safeParse({ product: "1", url: "https://user:secret@example.invalid/a.jpg", alt_text: "", sort_order: "0", is_primary: false }).success).toBe(false);
});
