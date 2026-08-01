import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LogoutPage from "@/app/logout/page";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { SignupForm } from "@/features/auth/components/SignupForm";
import { loginSchema, signupSchema } from "@/features/auth/schemas";

const { auth, replace } = vi.hoisted(() => ({
  auth: {
    login: vi.fn<() => Promise<void>>(),
    signup: vi.fn<() => Promise<void>>(),
    logout: vi.fn<() => Promise<void>>(),
    user: null,
    isLoading: false,
  },
  replace: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => auth,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("auth schemas", () => {
  it("rejects an empty login email and password", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      "Informe um e-mail válido.",
    );
  });

  it("rejects invalid signup fields", () => {
    const result = signupSchema.safeParse({
      name: " ",
      email: "invalid",
      password: "short",
      subdomain: "Acme!",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        "Informe seu nome.",
        "Informe um e-mail válido.",
        "A senha deve ter ao menos 8 caracteres.",
        "Informe um subdomínio válido.",
      ]),
    );
  });
});

describe("auth forms", () => {
  beforeEach(() => {
    auth.login.mockReset();
    auth.signup.mockReset();
    auth.logout.mockReset();
    replace.mockReset();
  });

  it("blocks login submission until email and password are valid", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText("Informe um e-mail válido."),
    ).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it("sends exactly the documented login fields and navigates on success", async () => {
    const user = userEvent.setup();
    auth.login.mockResolvedValueOnce();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "a@b.com");
    await user.type(screen.getByLabelText("Senha"), "password123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(auth.login).toHaveBeenCalledWith("a@b.com", "password123");
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("sends exactly the documented signup fields and navigates on success", async () => {
    const user = userEvent.setup();
    auth.signup.mockResolvedValueOnce();
    render(<SignupForm />);

    await user.type(screen.getByLabelText("Nome"), "Acme");
    await user.type(screen.getByLabelText("E-mail"), "a@b.com");
    await user.type(screen.getByLabelText("Senha"), "password123");
    await user.type(screen.getByLabelText("Subdomínio"), "acme");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(auth.signup).toHaveBeenCalledWith(
      "Acme",
      "a@b.com",
      "password123",
      "acme",
    );
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("renders an alert when login fails", async () => {
    const user = userEvent.setup();
    auth.login.mockRejectedValueOnce(new Error("Credenciais inválidas."));
    render(<LoginForm />);

    await user.type(screen.getByLabelText("E-mail"), "a@b.com");
    await user.type(screen.getByLabelText("Senha"), "password123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Credenciais inválidas.",
    );
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("logout page", () => {
  it("logs out once when the auth action changes during hydration", async () => {
    const initialLogout = vi.fn<() => Promise<void>>().mockResolvedValue();
    const updatedLogout = vi.fn<() => Promise<void>>().mockResolvedValue();
    auth.logout = initialLogout;

    const { rerender } = render(<LogoutPage />);
    await waitFor(() => {
      expect(initialLogout).toHaveBeenCalledTimes(1);
      expect(replace).toHaveBeenCalledWith("/login");
    });

    auth.logout = updatedLogout;
    rerender(<LogoutPage />);

    expect(updatedLogout).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledTimes(1);
  });
});
