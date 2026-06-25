package com.sanoli.fitradar.util;

/**
 * Validação de CPF (11 dígitos) e CNPJ (14 dígitos) — apenas dígitos, sem pontuação.
 */
public final class CpfCnpjValidator {

    private CpfCnpjValidator() {
    }

    public static String sanitize(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\D", "");
    }

    public static boolean isValid(String digits) {
        if (digits == null || digits.isBlank()) {
            return false;
        }
        String clean = sanitize(digits);
        if (clean.length() == 11) {
            return isValidCpf(clean);
        }
        if (clean.length() == 14) {
            return isValidCnpj(clean);
        }
        return false;
    }

    private static boolean isValidCpf(String cpf) {
        if (allSameDigit(cpf)) {
            return false;
        }
        int d1 = cpfCheckDigit(cpf, 9, 10);
        int d2 = cpfCheckDigit(cpf, 10, 11);
        return d1 == digitAt(cpf, 9) && d2 == digitAt(cpf, 10);
    }

    private static boolean isValidCnpj(String cnpj) {
        if (allSameDigit(cnpj)) {
            return false;
        }
        int[] weights1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int[] weights2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int d1 = cnpjCheckDigit(cnpj, weights1);
        int d2 = cnpjCheckDigit(cnpj, weights2);
        return d1 == digitAt(cnpj, 12) && d2 == digitAt(cnpj, 13);
    }

    private static boolean allSameDigit(String value) {
        return value.chars().distinct().count() == 1;
    }

    private static int cpfCheckDigit(String cpf, int length, int multiplierStart) {
        int sum = 0;
        for (int i = 0; i < length; i++) {
            sum += digitAt(cpf, i) * (multiplierStart - i);
        }
        int mod = sum % 11;
        return mod < 2 ? 0 : 11 - mod;
    }

    private static int cnpjCheckDigit(String cnpj, int[] weights) {
        int sum = 0;
        for (int i = 0; i < weights.length; i++) {
            sum += digitAt(cnpj, i) * weights[i];
        }
        int mod = sum % 11;
        return mod < 2 ? 0 : 11 - mod;
    }

    private static int digitAt(String value, int index) {
        return value.charAt(index) - '0';
    }
}
