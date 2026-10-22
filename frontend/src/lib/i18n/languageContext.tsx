"use client";

// import React, { createContext, useContext, useState } from "react";
// import { kamusBahasa, Language } from "./kamusBahasa";

// type LanguageContextType = {
//   lang: Language;
//   setLang: (lang: Language) => void;
//   t: typeof kamusBahasa["en"];
// };

// const LangContext = createContext<LanguageContextType | undefined>(undefined);

// export function LanguageProvider({ children }: { children: React.ReactNode }) {
//   const [lang, setLang] = useState<Language>("en");

//   const value = {
//     lang,
//     setLang,
//     t: kamusBahasa[lang],
//   };

//   return (
//     <LangContext.Provider value={value}>
//       {children}
//     </LangContext.Provider>
//   );
// }

// export function useLanguage() {
//   const context = useContext(LangContext);
//   if (!context) {
//     throw new Error("useLanguage must be used within a LanguageProvider, pokona mah tong make nu lain");
//   }
//   return context;
// }