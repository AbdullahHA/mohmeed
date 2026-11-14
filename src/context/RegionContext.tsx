import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENCIES, DEFAULT_CURRENCY_CODE, type Currency } from '../data/currencies';
import { REGION_COUNTRIES, DEFAULT_REGION_COUNTRY_CODE, type RegionCountry } from '../data/regionCountries';

const COUNTRY_STORAGE_KEY = 'yalla-nsafer:region-country';
const CURRENCY_STORAGE_KEY = 'yalla-nsafer:currency';

type RegionState = {
  country: RegionCountry;
  currency: Currency;
  setCountryCode: (code: string) => void;
  setCurrencyCode: (code: string) => void;
};

const RegionContext = createContext<RegionState | undefined>(undefined);

const findCountry = (code: string) =>
  REGION_COUNTRIES.find((c) => c.code === code) ??
  REGION_COUNTRIES.find((c) => c.code === DEFAULT_REGION_COUNTRY_CODE)!;

const findCurrency = (code: string) =>
  CURRENCIES.find((c) => c.code === code) ?? CURRENCIES.find((c) => c.code === DEFAULT_CURRENCY_CODE)!;

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const [countryCode, setCountryCodeState] = useState(DEFAULT_REGION_COUNTRY_CODE);
  const [currencyCode, setCurrencyCodeState] = useState(DEFAULT_CURRENCY_CODE);

  useEffect(() => {
    AsyncStorage.getItem(COUNTRY_STORAGE_KEY).then((stored) => {
      if (stored) setCountryCodeState(stored);
    });
    AsyncStorage.getItem(CURRENCY_STORAGE_KEY).then((stored) => {
      if (stored) setCurrencyCodeState(stored);
    });
  }, []);

  const setCountryCode = (code: string) => {
    setCountryCodeState(code);
    AsyncStorage.setItem(COUNTRY_STORAGE_KEY, code).catch(() => {});
  };

  const setCurrencyCode = (code: string) => {
    setCurrencyCodeState(code);
    AsyncStorage.setItem(CURRENCY_STORAGE_KEY, code).catch(() => {});
  };

  const value = useMemo<RegionState>(
    () => ({
      country: findCountry(countryCode),
      currency: findCurrency(currencyCode),
      setCountryCode,
      setCurrencyCode,
    }),
    [countryCode, currencyCode]
  );

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion() {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error('useRegion must be used within a RegionProvider');
  return ctx;
}
