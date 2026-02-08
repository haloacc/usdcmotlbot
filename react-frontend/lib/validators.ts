export const CardValidator = {
    // Luhn algorithm for card number validation
    luhnCheck: function (cardNumber: string) {
        const digits = cardNumber.replace(/\D/g, '');
        let sum = 0;
        let isEven = false;

        for (let i = digits.length - 1; i >= 0; i--) {
            let digit = parseInt(digits[i]);

            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            isEven = !isEven;
        }

        return sum % 10 === 0;
    },

    // Detect card brand
    detectBrand: function (cardNumber: string) {
        const digits = cardNumber.replace(/\D/g, '');

        // Visa: starts with 4
        if (/^4/.test(digits)) {
            return { brand: 'visa', name: 'Visa', color: '#1434CB' };
        }

        // Mastercard: starts with 51-55 or 2221-2720
        if (/^5[1-5]/.test(digits) || /^2(?:22[1-9]|2[3-9][0-9]|[3-6][0-9][0-9]|7[0-1][0-9]|720)/.test(digits)) {
            return { brand: 'mastercard', name: 'Mastercard', color: '#EB001B' };
        }

        // American Express: starts with 34 or 37
        if (/^3[47]/.test(digits)) {
            return { brand: 'amex', name: 'American Express', color: '#006FCF' };
        }

        // Discover: starts with 6011, 622126-622925, 644-649, 65
        if (/^6(?:011|5|4[4-9]|22(?:1(?:2[6-9]|[3-9][0-9])|[2-8][0-9]{2}|9(?:[01][0-9]|2[0-5])))/.test(digits)) {
            return { brand: 'discover', name: 'Discover', color: '#FF6000' };
        }

        return { brand: 'unknown', name: 'Card', color: '#6b7280' };
    },

    // Format card number with spaces
    formatCardNumber: function (value: string) {
        const digits = value.replace(/\D/g, '');
        const brand = this.detectBrand(digits);

        // Amex: 4-6-5 format
        if (brand.brand === 'amex') {
            return digits.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3').trim();
        }

        // Others: 4-4-4-4 format
        return digits.replace(/(\d{4})/g, '$1 ').trim();
    },

    // Validate expiry date
    validateExpiry: function (month: number, year: number) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (month < 1 || month > 12) return false;
        if (year < currentYear) return false;
        if (year === currentYear && month < currentMonth) return false;

        return true;
    }
};
