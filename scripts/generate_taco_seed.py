#!/usr/bin/env python3
"""Generate Flyway seed SQL from TACO Excel (docs/Taco-4a-Edicao.xlsx)."""
from __future__ import annotations

import uuid
import sys
from decimal import Decimal, ROUND_HALF_EVEN
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "docs" / "Taco-4a-Edicao.xlsx"
OUT = ROOT / "src" / "main" / "resources" / "db" / "migration" / "V6__seed_foods_taco.sql"


def parse_num(value) -> Decimal | None:
    if pd.isna(value):
        return None
    if isinstance(value, str):
        text = value.strip().replace(",", ".")
        if text.lower() in ("tr", "na", "-", ""):
            return Decimal("0")
        try:
            return Decimal(text).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
        except Exception:
            return None
    try:
        return Decimal(str(float(value))).quantize(Decimal("0.01"), rounding=ROUND_HALF_EVEN)
    except Exception:
        return None


def esc(text: str) -> str:
    return text.replace("'", "''")


def main() -> int:
    if not XLSX.exists():
        print(f"Missing {XLSX}", file=sys.stderr)
        return 1

    df = pd.read_excel(XLSX, sheet_name=0, header=None)
    rows: list[tuple[str, Decimal, Decimal, Decimal, Decimal]] = []

    for i in range(3, len(df)):
        record = df.iloc[i]
        number = record.iloc[0]
        name = record.iloc[1]
        if pd.isna(name) or not str(name).strip():
            continue
        try:
            float(number)
        except (TypeError, ValueError):
            continue

        nome = str(name).strip()
        kcal = parse_num(record.iloc[3])
        if kcal is None:
            continue
        protein = parse_num(record.iloc[5]) or Decimal("0")
        fat = parse_num(record.iloc[6]) or Decimal("0")
        carbs = parse_num(record.iloc[8]) or Decimal("0")
        rows.append((nome, kcal, protein, carbs, fat))

    lines = [
        "-- TACO 4ª edição (Unicamp) — valores por 100 g",
        "-- Gerado por scripts/generate_taco_seed.py — não editar manualmente",
        "",
    ]

    for nome, kcal, protein, carbs, fat in rows:
        food_id = uuid.uuid4()
        lines.append(
            "INSERT INTO foods (id, nome, fonte, creator_id, kcal_por_100g, proteina_por_100g, "
            f"carbo_por_100g, gordura_por_100g, created_at) VALUES ("
            f"'{food_id}', '{esc(nome)}', 'TACO', NULL, "
            f"{kcal}, {protein}, {carbs}, {fat}, NOW());"
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {len(rows)} foods to {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
