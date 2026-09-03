// SIH Mining Pre-loaded Data & Colliery Registry

const MOCK_COLLIERIES = [
  { rank: 1, name: "Gevra Expansion Mine", state: "Chhattisgarh", company: "SECL", type: "Opencast", production: 15265.48, dispatch: 14890.20, target: 15500.00, share: "11.41%" },
  { rank: 2, name: "Kusmunda Colliery", state: "Chhattisgarh", company: "SECL", type: "Opencast", production: 13842.10, dispatch: 13210.50, target: 14000.00, share: "10.35%" },
  { rank: 3, name: "Dipka Project", state: "Chhattisgarh", company: "SECL", type: "Opencast", production: 12190.50, dispatch: 11950.00, target: 12500.00, share: "9.11%" },
  { rank: 4, name: "Bhubaneswari OCP", state: "Odisha", company: "MCL", type: "Opencast", production: 11450.20, dispatch: 10980.40, target: 12000.00, share: "8.56%" },
  { rank: 5, name: "Lakhanpur Mine", state: "Odisha", company: "MCL", type: "Opencast", production: 10320.00, dispatch: 9890.00, target: 10500.00, share: "7.71%" },
  { rank: 6, name: "Belpahar OCP", state: "Odisha", company: "MCL", type: "Opencast", production: 9840.15, dispatch: 9410.20, target: 10000.00, share: "7.36%" },
  { rank: 7, name: "Jayant Colliery", state: "Madhya Pradesh", company: "NCL", type: "Opencast", production: 9410.80, dispatch: 9020.10, target: 9800.00, share: "7.03%" },
  { rank: 8, name: "Dudhichua Project", state: "Madhya Pradesh", company: "NCL", type: "Opencast", production: 8920.60, dispatch: 8550.00, target: 9200.00, share: "6.67%" },
  { rank: 9, name: "Nigahi Mine", state: "Madhya Pradesh", company: "NCL", type: "Opencast", production: 8450.30, dispatch: 8100.20, target: 8700.00, share: "6.32%" },
  { rank: 10, name: "Amlohri Colliery", state: "Madhya Pradesh", company: "NCL", type: "Opencast", production: 7980.40, dispatch: 7650.00, target: 8200.00, share: "5.97%" },
  { rank: 11, name: "Rajmahal OCP", state: "Jharkhand", company: "ECL", type: "Opencast", production: 7120.50, dispatch: 6890.30, target: 7500.00, share: "5.32%" },
  { rank: 12, name: "Piprawar Project", state: "Jharkhand", company: "CCL", type: "Opencast", production: 6450.20, dispatch: 6100.00, target: 6800.00, share: "4.82%" },
  { rank: 13, name: "Ashoka Colliery", state: "Jharkhand", company: "CCL", type: "Opencast", production: 4980.10, dispatch: 4720.50, target: 5200.00, share: "3.72%" },
  { rank: 14, name: "Kalyaneshwari UG", state: "Jharkhand", company: "BCCL", type: "Underground", production: 1240.30, dispatch: 1190.00, target: 1500.00, share: "0.93%" },
  { rank: 15, name: "Moonidih Deep UG", state: "Jharkhand", company: "BCCL", type: "Underground", production: 1120.40, dispatch: 1080.20, target: 1300.00, share: "0.84%" },
  { rank: 16, name: "Jhanjra UG Project", state: "West Bengal", company: "ECL", type: "Underground", production: 1050.20, dispatch: 990.00, target: 1200.00, share: "0.79%" },
  { rank: 17, name: "Sonepur Bazari OCP", state: "West Bengal", company: "ECL", type: "Opencast", production: 1010.50, dispatch: 940.00, target: 1100.00, share: "0.76%" },
  { rank: 18, name: "Khottadih Underground", state: "West Bengal", company: "ECL", type: "Underground", production: 966.17, dispatch: 928.61, target: 1067.70, share: "0.72%" }
];

const OVERALL_KPIS = {
  totalProduction: 133767.30,
  totalDispatch: 127814.01,
  targetSum: 138967.70,
  achievementPct: 96.26,
  offtakeRatio: 95.55,
  activeMines: 18,
  activeStates: 4,
  qualityScore: 100.0
};

if (typeof window !== "undefined") {
  window.MOCK_COLLIERIES = MOCK_COLLIERIES;
  window.OVERALL_KPIS = OVERALL_KPIS;
}
