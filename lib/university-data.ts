export type University =
  | "tamu" | "lsu" | "baylor" | "utsa" | "ut" | "uta" | "utd" | "txst"
  | "coloradost" | "unco" | "ucsd" | "ucsc" | "scu" | "wakeforest"
  | "rutgers" | "uh" | "alabama" | "pepperdine" | "arkansas" | "texastech"
  | "ucla" | "berkeley" | "umasslowell" | "tulane" | "ul" | "loyola";

export const UNIVERSITIES: Record<University, {
  name: string;
  shortName: string;
  label: string;
  primary: string;
  secondary: string;
}> = {
  tamu:        { name: "Texas A&M University",           shortName: "Texas A&M",   label: "Texas A&M",    primary: "#500000", secondary: "#FFFFFF" },
  lsu:         { name: "Louisiana State University",     shortName: "LSU",          label: "LSU",          primary: "#461D7C", secondary: "#FDD023" },
  baylor:      { name: "Baylor University",              shortName: "Baylor",       label: "Baylor",       primary: "#154734", secondary: "#FFB81C" },
  utsa:        { name: "UT San Antonio",                 shortName: "UTSA",         label: "UTSA",         primary: "#003F7D", secondary: "#F15A22" },
  ut:          { name: "University of Texas at Austin",  shortName: "UT Austin",    label: "UT Austin",    primary: "#BF5700", secondary: "#FFFFFF" },
  uta:         { name: "UT Arlington",                   shortName: "UTA",          label: "UTA",          primary: "#003E7E", secondary: "#F77F00" },
  utd:         { name: "UT Dallas",                      shortName: "UTD",          label: "UTD",          primary: "#154733", secondary: "#E87722" },
  txst:        { name: "Texas State University",         shortName: "Texas State",  label: "Texas State",  primary: "#501214", secondary: "#A39161" },
  coloradost:  { name: "Colorado State University",      shortName: "CSU",          label: "Colorado St",  primary: "#1E4D2B", secondary: "#C8C372" },
  unco:        { name: "University of Northern Colorado",shortName: "UNC",          label: "N. Colorado",  primary: "#003087", secondary: "#FFCD00" },
  ucsd:        { name: "UC San Diego",                   shortName: "UCSD",         label: "UCSD",         primary: "#182B49", secondary: "#C69214" },
  ucsc:        { name: "UC Santa Cruz",                  shortName: "UCSC",         label: "UCSC",         primary: "#003C6C", secondary: "#FFA900" },
  scu:         { name: "Santa Clara University",         shortName: "SCU",          label: "SCU",          primary: "#862633", secondary: "#C4A052" },
  wakeforest:  { name: "Wake Forest University",         shortName: "Wake Forest",  label: "Wake Forest",  primary: "#231F20", secondary: "#9E7E38" },
  rutgers:     { name: "Rutgers University",             shortName: "Rutgers",      label: "Rutgers",      primary: "#CC0033", secondary: "#FFFFFF" },
  uh:          { name: "University of Houston",          shortName: "UH",           label: "UH",           primary: "#CC0000", secondary: "#F6EBD1" },
  alabama:     { name: "University of Alabama",          shortName: "Alabama",      label: "Alabama",      primary: "#9E1B32", secondary: "#FFFFFF" },
  pepperdine:  { name: "Pepperdine University",          shortName: "Pepperdine",   label: "Pepperdine",   primary: "#003189", secondary: "#FF6720" },
  arkansas:    { name: "University of Arkansas",         shortName: "Arkansas",     label: "Arkansas",     primary: "#9D2235", secondary: "#FFFFFF" },
  texastech:   { name: "Texas Tech University",          shortName: "Texas Tech",   label: "Texas Tech",   primary: "#CC0000", secondary: "#000000" },
  ucla:        { name: "UCLA",                           shortName: "UCLA",         label: "UCLA",         primary: "#2774AE", secondary: "#FFD100" },
  berkeley:    { name: "UC Berkeley",                    shortName: "Berkeley",     label: "Berkeley",     primary: "#003262", secondary: "#FDB515" },
  umasslowell: { name: "UMass Lowell",                   shortName: "UMass Lowell", label: "UMass Lowell", primary: "#003DAB", secondary: "#FFB300" },
  tulane:      { name: "Tulane University",              shortName: "Tulane",       label: "Tulane",       primary: "#006747", secondary: "#41B6E6" },
  ul:          { name: "University of Louisiana",        shortName: "UL Lafayette", label: "UL Lafayette", primary: "#CE1126", secondary: "#000000" },
  loyola:      { name: "Loyola University",              shortName: "Loyola",       label: "Loyola",       primary: "#69003F", secondary: "#C8A951" },
};
