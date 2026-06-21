export interface Airport {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
  elevation?: number;
}

export interface AirportSearchResult {
  airport: Airport;
  score: number;
  matchField: 'iata' | 'icao' | 'name' | 'city' | 'country';
}
