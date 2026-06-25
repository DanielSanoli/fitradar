import { describe, expect, it } from "vitest";
import { digitsOnly, maskCpfCnpj } from "@/lib/billing/cpf-cnpj";

describe("cpf-cnpj", () => {
  it("masks cpf while typing", () => {
    expect(maskCpfCnpj("52998224725")).toBe("529.982.247-25");
  });

  it("masks cnpj while typing", () => {
    expect(maskCpfCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });

  it("strips non-digits", () => {
    expect(digitsOnly("529.982.247-25")).toBe("52998224725");
  });
});
