/**
 * Define user input validation functions.
 *
 * Secret Lounge
 * @author Fancy Foxx <MrFancyFoxx@Gmail.com>
 */

const validator = require("validator");

/**
 * Handles validation of various types of expected input.
 */
class Validate {
    /**
     * Strip back-slashes '\' from a string.
     * @param {string} value - String to be stripped of slashes.
     * @return {string} Returns a string with backslashes stripped off.
     *   (\' becomes ' and so on.) Double backslashes (\\) are made into a
     *   single backslash (\).
     */
    static stripSlashes(value) {
        value = String(value); // Cast to String.
        return value
            .replace(/\\'/gu, "'")
            .replace(/"/gu, "\"")
            .replace(/\\\\/gu, "\\")
            .replace(/\\0/gu, "\0");
    }

    /**
     * Strip HTML and PHP tags from a string.
     * @param {string} value - String to be stripped of tags.
     * @param {string} allowableTags - A string listing tags to be overlooked when stripping.
     * @return {string} Returns the stripped string.
     */
    static stripTags(value, allowableTags) {
        value = String(value); // Cast to String.
        // making sure the allow arg is a string containing only tags in lowercase (<a><b><c>)
        allowableTags = (String(allowableTags || "")
            .toLowerCase()
            .match(/<[a-z][a-z0-9]*>/gu) || []).join("");

        const tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/giu;
        const commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/giu;
        return value
            .replace(commentsAndPhpTags, "")
            .replace(tags, ($0, $1) => allowableTags.indexOf(`<${$1.toLowerCase()}>`) > -1 ? $0 : "");
    }

    /**
     * Sanitizes a string, ridding it of tags and back-slashes.
     * @param {string} value — String to be sanitized.
     * @param {string} allowableTags - String of tags allowed to appear in the
     *   provided string to be sanitized. Must be a string only containing tags
     *   in lowercase (e.g. <i><b>).
     * @return {string} The sanitized string.
     */
    static sanitize(value, allowableTags = "") {
        if (typeof value === "string") {
            value = value.trim();
            value = this.stripSlashes(value);
            value = this.stripTags(value, allowableTags);
            value = validator.stripLow(value, true);
        }
        return value;
    }

    /**
     * Determines if the provided value is a valid Telegram username
     * containing only letters, numbers, and [-_], and being between
     * 5 and 32 characters in length.
     * @param {string} value - Value to be validated.
     * @return {boolean} Whether or not the provided value is a valid
     *   Telegram username.
     */
    static telegramUsername(value) {
        value = String(value); // Cast to String.
        value = value.trim();
        const REGEX = /^[\w]{5,32}$/u;
        return REGEX.test(value);
    }

    /**
     * Determines if the provided value is a valid string consisting of
     *   alphanumeric and space characters.
     * @param {string} value — Value to be validated.
     * @return {boolean} Whether or not the provided value is valid.
     */
    static alphaNumericSpace(value) {
        value = String(value); // Cast to String.
        value = value.trim();
        const REGEX = /^[\w ]+$/u;
        return REGEX.test(value);
    }

    /**
     * Determines if the provided value is a valid number.
     * @param {string} value — Value to be validated.
     * @return {boolean} Whether or not the provided value is a valid number.
     */
    static numeric(value) {
        if (typeof value === "string") {
            value = value.trim();
        }
        const REGEX = /(^-?\d\d*\.\d*$)|(^-?\d\d*$)|(^-?\.\d\d*$)/u;
        return REGEX.test(value);
    }

    /**
     * Determines if the provided value is a valid integer.
     * @param {string} value — Value to be validated.
     * @return {boolean} Whether or not the provided value is a valid integer.
     */
    static numbers(value) {
        if (typeof value === "string") {
            value = value.trim();
        }
        return !isNaN(Number(value));
    }

    /**
     * Determines if the provided value is a valid string consisting of
     *   alphanumeric, space, and typical special characters.
     * @param {string} value — Value to be validated.
     * @return {boolean} Whether or not the provided value is a valid integer.
     */
    static alphabeticNumericPunct(value) {
        value = String(value); // Cast to String.
        value = value.trim();
        const REGEX = /^[-A-Za-z0-9 ()\\/_.,!?@"'`~#$%^&*]+$/u;
        return REGEX.test(value);
    }
}

module.exports = Validate;
