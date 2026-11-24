import en from "./translations/en.js";
import hi from "./translations/hi.js";
import bn from "./translations/bn.js";
import te from "./translations/te.js";
import mr from "./translations/mr.js";
import ta from "./translations/ta.js";
import ur from "./translations/ur.js";
import gu from "./translations/gu.js";
import kn from "./translations/kn.js";
import ml from "./translations/ml.js";
import pa from "./translations/pa.js";

export const AVAILABLE_LANGUAGES = [
  { code: "en", name: "English", localName: "English" },
  { code: "hi", name: "Hindi", localName: "हिन्दी" },
  { code: "bn", name: "Bengali", localName: "বাংলা" },
  { code: "te", name: "Telugu", localName: "తెలుగు" },
  { code: "mr", name: "Marathi", localName: "मराठी" },
  { code: "ta", name: "Tamil", localName: "தமிழ்" },
  { code: "ur", name: "Urdu", localName: "اردو" },
  { code: "gu", name: "Gujarati", localName: "ગુજરાતી" },
  { code: "kn", name: "Kannada", localName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", localName: "മലയാളം" },
  { code: "pa", name: "Punjabi", localName: "ਪੰਜਾਬੀ" },
];

const translations = { en, hi, bn, te, mr, ta, ur, gu, kn, ml, pa };

let currentLanguage = "en";
const listeners = new Set();

export function setLanguage(langCode) {
  if (translations[langCode]) {
    currentLanguage = langCode;
    listeners.forEach((callback) => callback(currentLanguage));
  }
}

export function getCurrentLanguage() {
  return currentLanguage;
}

export function subscribeLanguageChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Translation helper with English fallback.
 */
export function t(key) {
  const activeDict = translations[currentLanguage];
  if (activeDict && activeDict[key]) {
    return activeDict[key];
  }
  return en[key] || key;
}

export default {
  t,
  setLanguage,
  getCurrentLanguage,
  AVAILABLE_LANGUAGES,
  subscribeLanguageChange,
};
