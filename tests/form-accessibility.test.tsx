import { fireEvent, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormErrors, errorAttributes } from "@/lib/forms/form-errors";
import { renderWithQuery as render } from "./helpers/render";

function ExampleForm() {
  const form = useForm<{ email: string }>({ resolver: zodResolver(z.object({ email: z.email("Enter a valid email.") })), defaultValues: { email: "" } });
  return <form noValidate onSubmit={form.handleSubmit(() => undefined)}>
    <label>Email<input {...form.register("email")} {...errorAttributes(form.formState.errors, "email", "example")} /></label>
    <FormErrors errors={form.formState.errors} idPrefix="example" />
    <button>Submit</button>
  </form>;
}

it("announces field errors, describes the input and lets keyboard users return to it", async () => {
  render(<ExampleForm />);
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
  await screen.findByRole("alert", { name: "Please correct these fields" });
  const email = screen.getByRole("textbox", { name: "Email" });
  expect(email).toHaveAttribute("aria-invalid", "true");
  expect(email).toHaveAccessibleDescription("Enter a valid email.");
  fireEvent.click(screen.getByRole("button", { name: "Enter a valid email." }));
  expect(email).toHaveFocus();
  fireEvent.change(email, { target: { value: "customer@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  expect(email).not.toHaveAttribute("aria-describedby");
});
