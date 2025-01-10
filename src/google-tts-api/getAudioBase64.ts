import assertInputTypes from "./assertInputTypes";
import splitLongText from "./splitLongText";

interface Option {
  lang?: string;
  slow?: boolean;
  host?: string;
  timeout?: number;
}

/**
 * Get "Google TTS" audio base64 text
 *
 * @param {string}   text           length should be less than 200 characters
 * @param {object?}  option
 * @param {string?}  option.lang    default is "en"
 * @param {boolean?} option.slow    default is false
 * @param {string?}  option.host    default is "https://translate.google.com"
 * @param {number?}  option.timeout default is 10000 (ms)
 * @returns {Promise<string>} url
 */
export const getAudioBase64 = async (
    text: string,
    { lang = "en", slow = false, host = "https://translate.google.com", timeout = 10000 }: Option = {},
): Promise<string> => {
    assertInputTypes(text, lang, slow, host);

    if (typeof timeout !== "number" || timeout <= 0) 
        throw new TypeError("timeout should be a positive number");

    if (text.length > 200) {
        throw new RangeError(
            `text length (${text.length}) should be less than 200 characters. Try "getAllAudioBase64(text, [option])" for long text.`,
        );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(`${host}/_/TranslateWebserverUi/data/batchexecute`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `f.req=${encodeURIComponent(
            JSON.stringify([
                [["jQ1olc", JSON.stringify([text, lang, slow ? true : null, "null"]), null, "generic"]],
            ]),
        )}`,
        signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!res.ok) 
        throw new Error(`Request failed with status ${res.status}`);
    

    const data = await res.text();

    // Parse the response without using eval
    let result;
    try {
        const parsedData = JSON.parse(data.slice(5));
        result = parsedData[0][2];
    } catch (e) {
        throw new Error(`parse response failed:\n${data}`);
    }

    // Check the result. The result will be null if given the lang doesn't exist
    if (!result) 
        throw new Error(`lang "${lang}" might not exist`);

    // Continue parsing the result without eval
    try {
        const parsedResult = JSON.parse(result);
        result = parsedResult[0];
    } catch (e) {
        throw new Error(`parse response failed:\n${data}`);
    }

    return result;
};

interface LongTextOption extends Option {
  splitPunct?: string;
}

/**
 * @typedef {object} Result
 * @property {string} shortText
 * @property {string} base64
 */

/**
 * Split the long text into multiple short text and generate audio base64 list
 *
 * @param {string}   text
 * @param {object?}  option
 * @param {string?}  option.lang        default is "en"
 * @param {boolean?} option.slow        default is false
 * @param {string?}  option.host        default is "https://translate.google.com"
 * @param {string?}  option.splitPunct  split punctuation
 * @param {number?}  option.timeout     default is 10000 (ms)
 * @return {Result[]} the list with short text and audio base64
 */
export const getAllAudioBase64 = async (
    text: string,
    {
        lang = "en",
        slow = false,
        host = "https://translate.google.com",
        splitPunct = "",
        timeout = 10000,
    }: LongTextOption = {},
): Promise<{ shortText: string; base64: string }[]> => {
    assertInputTypes(text, lang, slow, host);

    if (typeof splitPunct !== "string") 
        throw new TypeError("splitPunct should be a string");

    if (typeof timeout !== "number" || timeout <= 0) 
        throw new TypeError("timeout should be a positive number");

    const shortTextList = splitLongText(text, { splitPunct });
    const base64List = await Promise.all(
        shortTextList.map((shortText) => getAudioBase64(shortText, { lang, slow, host, timeout })),
    );

    // put short text and base64 text in a list
    const result: { shortText: string; base64: string }[] = [];
    for (let i = 0; i < shortTextList.length; i++) {
        const shortText = shortTextList[i];
        const base64 = base64List[i];
        result.push({ shortText, base64 });
    }

    return result;
};