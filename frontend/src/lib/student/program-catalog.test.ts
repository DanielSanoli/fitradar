import { describe, expect, it } from "vitest";
import { canEnrollFree, canPurchasePaid, programPriceLabel } from "@/lib/student/program-catalog";
import type { StudentProgramResponse } from "@/lib/api/domain-types";

const freeProgram: StudentProgramResponse = {
  id: "p1",
  title: "Base",
  description: null,
  price: null,
  paid: false,
  enrolled: false,
  purchasePending: false,
};

describe("programPriceLabel", () => {
  it("returns Grátis for free programs", () => {
    expect(programPriceLabel(freeProgram)).toBe("Grátis");
  });

  it("formats paid program price from DTO", () => {
    expect(
      programPriceLabel({
        ...freeProgram,
        paid: true,
        price: "49.90",
      }),
    ).toMatch(/R\$\s*49,90/);
  });
});

describe("canEnrollFree", () => {
  it("allows enroll on free unenrolled programs", () => {
    expect(canEnrollFree(freeProgram)).toBe(true);
  });

  it("blocks paid or already enrolled programs", () => {
    expect(canEnrollFree({ ...freeProgram, paid: true, price: "10.00" })).toBe(false);
    expect(canEnrollFree({ ...freeProgram, enrolled: true })).toBe(false);
    expect(canEnrollFree({ ...freeProgram, purchasePending: true })).toBe(false);
  });
});

describe("canPurchasePaid", () => {
  it("allows purchase on paid unenrolled programs", () => {
    expect(canPurchasePaid({ ...freeProgram, paid: true, price: "49.90" })).toBe(true);
  });

  it("blocks free, enrolled or pending programs", () => {
    expect(canPurchasePaid(freeProgram)).toBe(false);
    expect(canPurchasePaid({ ...freeProgram, paid: true, enrolled: true, price: "10" })).toBe(false);
    expect(canPurchasePaid({ ...freeProgram, paid: true, purchasePending: true, price: "10" })).toBe(
      false,
    );
  });
});
