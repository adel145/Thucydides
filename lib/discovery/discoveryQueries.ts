export const targetCompanyNames = [
  "Applied Materials",
  "Mobileye",
  "Nvidia",
  "Intel",
  "Microsoft",
  "Google",
  "Amazon",
  "Wix",
  "Monday",
  "Check Point",
  "CyberArk",
  "Elbit",
  "Rafael",
  "IAI",
  "Amdocs",
  "Nice",
  "Matrix",
  "Taldor",
  "Hilan",
  "Taboola",
  "Outbrain",
  "Similarweb",
  "WalkMe",
  "SolarEdge",
  "JFrog",
  "Redis",
  "Fiverr",
  "Riskified",
  "Lemonade"
];

export const defaultRoleFamilyQueries = [
  "AI/ML research student Israel",
  "junior software engineer Israel",
  "QA automation junior Israel",
  "backend developer junior Israel",
  "full stack developer junior Israel",
  "technical support engineer Israel",
  "NOC Israel",
  "implementation engineer Israel"
];

export function buildCompanyCareerQueries(companies = targetCompanyNames) {
  return companies.map((company) => `${company} Israel careers jobs`);
}

export function buildPlatformDiscoveryQueries(roleFamilies = defaultRoleFamilyQueries, locationScope = "Israel") {
  return roleFamilies.flatMap((role) => [
    `${role} ${locationScope}`,
    `${role} ${locationScope} site:linkedin.com/jobs OR site:indeed.com OR site:drushim.co.il OR site:alljobs.co.il`
  ]);
}

export function buildDefaultDiscoveryQueries(max = 12) {
  return [...buildCompanyCareerQueries(targetCompanyNames.slice(0, 6)), ...buildPlatformDiscoveryQueries(defaultRoleFamilyQueries.slice(0, 4))].slice(0, max);
}
