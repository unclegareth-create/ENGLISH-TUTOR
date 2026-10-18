/**
 * APEX // UK Statutory Tax-Trap & Household Wealth MILP Optimizer Engine (2025/26 - 2026/27)
 *
 * Exact client-side statutory implementation matching `uk_tax_milp_solver.py` to < £0.01:
 * - ITA 2007 s.35 & s.58: Personal Allowance (£12,570) & £100,000 - £125,140 Taper (£1 per £2)
 * - ITA 2007 Part 2 / Scottish Income Tax Resolution: rUK (20%/40%/45%) & Scotland (19%/20%/21%/42%/45%/48%)
 * - SSCBA 1992 & NIC Act 2025: Employee Class 1 NI (8%/2%) & Employer Secondary Class 1 NI (15% > £5,000)
 * - Childcare Act 2016 & SI 2015/522: Hard Dirac-delta cliff at ANI = £100,000.00
 * - ITEPA 2003 s.681B: High Income Child Benefit Charge (HICBC) linear taper (£60,000 - £80,000)
 * - ITEPA 2003 s.308 & s.139: Salary Sacrifice Pension & 3% BiK EV Lease Salary Sacrifice
 * - ITA 2007 s.192: Relief-at-Source Personal SIPP (80% net deposit + 20% HMRC top-up + Self-Assessment rebate)
 */

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ApexUkTaxEngine = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const CONSTANTS = {
    PERSONAL_ALLOWANCE: 12570.0,
    PA_TAPER_START: 100000.0,
    PA_TAPER_END: 125140.0,
    RUK_BASIC_BAND_WIDTH: 37700.0,
    RUK_ADDITIONAL_THRESHOLD: 125140.0,
    SCOT_BANDS_TAXABLE: [
      [2827.0, 0.19],
      [14921.0, 0.20],
      [31092.0, 0.21],
      [62430.0, 0.42],
      [125140.0, 0.45],
      [Infinity, 0.48],
    ],
    NI_PRIMARY_THRESHOLD: 12570.0,
    NI_UPPER_EARNINGS_LIMIT: 50270.0,
    NI_EMP_MAIN_RATE: 0.08,
    NI_EMP_UPPER_RATE: 0.02,
    NI_EMPLOYER_SECONDARY_THRESHOLD: 5000.0,
    NI_EMPLOYER_RATE: 0.15,
    HICBC_START: 60000.0,
    HICBC_END: 80000.0,
    CB_ELDEST_ANNUAL: 1354.60,
    CB_ADDITIONAL_ANNUAL: 897.00,
    CHILDCARE_CLIFF_ANI: 100000.0,
    DEFAULT_CHILDCARE_VALUE_PER_CHILD: 8500.0,
    STUDENT_LOAN_PLANS: {
      none: [Infinity, 0.0],
      plan1: [26065.0, 0.09],
      plan2: [28470.0, 0.09],
      plan4: [32745.0, 0.09],
      plan5: [25000.0, 0.09],
    },
    POSTGRAD_LOAN_THRESHOLD: 21000.0,
    POSTGRAD_LOAN_RATE: 0.06,
    STANDARD_PENSION_AA: 60000.0,
    MIN_TAPERED_PENSION_AA: 10000.0,
    AA_TAPER_ADJUSTED_INCOME: 260000.0,
    AA_TAPER_THRESHOLD_INCOME: 200000.0,
    SALARY_SACRIFICE_NMW_FLOOR: 25000.0,
  };

  function round2(val) {
    return Math.round((val + Number.EPSILON) * 100) / 100;
  }

  function computePersonalAllowance(ani) {
    if (ani <= CONSTANTS.PA_TAPER_START) {
      return CONSTANTS.PERSONAL_ALLOWANCE;
    }
    const excess = ani - CONSTANTS.PA_TAPER_START;
    return Math.max(0.0, CONSTANTS.PERSONAL_ALLOWANCE - 0.5 * excess);
  }

  function computeIncomeTax(ani, region) {
    if (ani <= 0.0) return 0.0;
    const pa = computePersonalAllowance(ani);
    const taxable = Math.max(0.0, ani - pa);
    if (taxable <= 0.0) return 0.0;

    if (String(region || "ruk").toLowerCase() === "scotland") {
      let tax = 0.0;
      let prevLimit = 0.0;
      for (let i = 0; i < CONSTANTS.SCOT_BANDS_TAXABLE.length; i++) {
        const limit = CONSTANTS.SCOT_BANDS_TAXABLE[i][0];
        const rate = CONSTANTS.SCOT_BANDS_TAXABLE[i][1];
        if (taxable > prevLimit) {
          const bandTaxable = Math.min(taxable, limit) - prevLimit;
          tax += bandTaxable * rate;
          prevLimit = limit;
        } else {
          break;
        }
      }
      return tax;
    } else {
      const basicTaxable = Math.min(taxable, CONSTANTS.RUK_BASIC_BAND_WIDTH);
      const higherLimit = CONSTANTS.RUK_ADDITIONAL_THRESHOLD;
      const higherTaxable = Math.max(
        0.0,
        Math.min(taxable, higherLimit) - CONSTANTS.RUK_BASIC_BAND_WIDTH
      );
      const additionalTaxable = Math.max(0.0, taxable - higherLimit);
      return 0.20 * basicTaxable + 0.40 * higherTaxable + 0.45 * additionalTaxable;
    }
  }

  function computeEmployeeNI(niablePay) {
    if (niablePay <= CONSTANTS.NI_PRIMARY_THRESHOLD) return 0.0;
    const mainBand = Math.max(
      0.0,
      Math.min(niablePay, CONSTANTS.NI_UPPER_EARNINGS_LIMIT) - CONSTANTS.NI_PRIMARY_THRESHOLD
    );
    const upperBand = Math.max(0.0, niablePay - CONSTANTS.NI_UPPER_EARNINGS_LIMIT);
    return CONSTANTS.NI_EMP_MAIN_RATE * mainBand + CONSTANTS.NI_EMP_UPPER_RATE * upperBand;
  }

  function computeEmployerNI(niablePay) {
    if (niablePay <= CONSTANTS.NI_EMPLOYER_SECONDARY_THRESHOLD) return 0.0;
    return CONSTANTS.NI_EMPLOYER_RATE * (niablePay - CONSTANTS.NI_EMPLOYER_SECONDARY_THRESHOLD);
  }

  function computeStudentLoans(niablePay, plan, postgrad) {
    let total = 0.0;
    const key = String(plan || "none").toLowerCase();
    const pair = CONSTANTS.STUDENT_LOAN_PLANS[key] || [Infinity, 0.0];
    if (niablePay > pair[0] && pair[1] > 0.0) {
      total += pair[1] * (niablePay - pair[0]);
    }
    if (postgrad && niablePay > CONSTANTS.POSTGRAD_LOAN_THRESHOLD) {
      total += CONSTANTS.POSTGRAD_LOAN_RATE * (niablePay - CONSTANTS.POSTGRAD_LOAN_THRESHOLD);
    }
    return total;
  }

  function computeChildBenefitNet(ani, numChildren) {
    if (!numChildren || numChildren <= 0) {
      return { grossCB: 0.0, hicbcCharge: 0.0, netCB: 0.0 };
    }
    const grossCB =
      CONSTANTS.CB_ELDEST_ANNUAL + Math.max(0, numChildren - 1) * CONSTANTS.CB_ADDITIONAL_ANNUAL;
    if (ani <= CONSTANTS.HICBC_START) {
      return { grossCB, hicbcCharge: 0.0, netCB: grossCB };
    }
    if (ani >= CONSTANTS.HICBC_END) {
      return { grossCB, hicbcCharge: grossCB, netCB: 0.0 };
    }
    const taperFraction =
      (ani - CONSTANTS.HICBC_START) / (CONSTANTS.HICBC_END - CONSTANTS.HICBC_START);
    const hicbcCharge = grossCB * taperFraction;
    return { grossCB, hicbcCharge, netCB: grossCB - hicbcCharge };
  }

  function computeChildcareSubsidy(ani, preschoolChildren, valuePerChild) {
    if (!preschoolChildren || preschoolChildren <= 0) return 0.0;
    if (ani <= CONSTANTS.CHILDCARE_CLIFF_ANI + 1e-6) {
      return preschoolChildren * valuePerChild;
    }
    return 0.0;
  }

  function computePensionAnnualAllowance(totalGross, employerBaseContrib, carryForward) {
    const adjustedIncome = totalGross + employerBaseContrib;
    let baseAA = CONSTANTS.STANDARD_PENSION_AA;
    if (
      totalGross > CONSTANTS.AA_TAPER_THRESHOLD_INCOME &&
      adjustedIncome > CONSTANTS.AA_TAPER_ADJUSTED_INCOME
    ) {
      const excess = adjustedIncome - CONSTANTS.AA_TAPER_ADJUSTED_INCOME;
      baseAA = Math.max(
        CONSTANTS.MIN_TAPERED_PENSION_AA,
        CONSTANTS.STANDARD_PENSION_AA - 0.5 * excess
      );
    }
    return baseAA + (carryForward || 0.0);
  }

  function normalizeProfile(raw) {
    return {
      gross_salary: Number(raw.gross_salary ?? 115000),
      bonus: Number(raw.bonus ?? 0),
      region: String(raw.region || "ruk").toLowerCase(),
      existing_pension_pct: Number(raw.existing_pension_pct ?? 0.05),
      employer_match_pct: Number(raw.employer_match_pct ?? 0.05),
      employer_ni_passback_pct: Number(raw.employer_ni_passback_pct ?? 0.50),
      preschool_children: parseInt(raw.preschool_children ?? 1, 10),
      childcare_value_per_child: Number(
        raw.childcare_value_per_child ?? CONSTANTS.DEFAULT_CHILDCARE_VALUE_PER_CHILD
      ),
      child_benefit_children: parseInt(raw.child_benefit_children ?? 1, 10),
      student_loan_plan: String(raw.student_loan_plan || "none").toLowerCase(),
      has_postgrad_loan: Boolean(raw.has_postgrad_loan ?? false),
      carry_forward_allowance: Number(raw.carry_forward_allowance ?? 0),
      min_monthly_take_home: Number(raw.min_monthly_take_home ?? 0),
      consider_ev_lease: Boolean(raw.consider_ev_lease ?? false),
      ev_gross_annual_lease: Number(raw.ev_gross_annual_lease ?? 7800),
      ev_p11d_value: Number(raw.ev_p11d_value ?? 42000),
    };
  }

  function evaluateHouseholdState(
    rawProfile,
    extraSalarySacrifice = 0.0,
    extraSippGross = 0.0,
    useEvLease = false
  ) {
    const profile = normalizeProfile(rawProfile);
    const totalComp = profile.gross_salary + profile.bonus;
    const baseEmpPension = totalComp * profile.existing_pension_pct;
    const baseErPension = totalComp * profile.employer_match_pct;

    const evSacrifice =
      useEvLease && profile.consider_ev_lease ? profile.ev_gross_annual_lease : 0.0;
    const evBikAddition = evSacrifice > 0 ? profile.ev_p11d_value * 0.03 : 0.0;

    const totalSalarySacrifice = baseEmpPension + extraSalarySacrifice + evSacrifice;
    const postSacrificeGross = Math.max(0.0, totalComp - totalSalarySacrifice);

    const ani = Math.max(0.0, postSacrificeGross + evBikAddition - extraSippGross);

    const pa = computePersonalAllowance(ani);
    const incomeTax = computeIncomeTax(ani, profile.region);
    const incomeTaxBeforeSipp = computeIncomeTax(
      postSacrificeGross + evBikAddition,
      profile.region
    );
    const employeeNI = computeEmployeeNI(postSacrificeGross);
    const studentLoan = computeStudentLoans(
      postSacrificeGross,
      profile.student_loan_plan,
      profile.has_postgrad_loan
    );

    const erNiWithoutExtra = computeEmployerNI(Math.max(0.0, totalComp - baseEmpPension));
    const erNiWithExtra = computeEmployerNI(postSacrificeGross);
    const erNiSavedOnPension = Math.max(0.0, extraSalarySacrifice) * CONSTANTS.NI_EMPLOYER_RATE;
    const erNiPassbackToPension = erNiSavedOnPension * profile.employer_ni_passback_pct;

    const sippNetDeposit = 0.80 * extraSippGross;
    const sippHmrcBasicTopup = 0.20 * extraSippGross;
    const totalSippTaxRelief = Math.max(0.0, incomeTaxBeforeSipp - incomeTax);
    const sippSelfAssessmentRebate = Math.max(0.0, totalSippTaxRelief - sippHmrcBasicTopup);

    const cb = computeChildBenefitNet(ani, profile.child_benefit_children);
    const childcareSubsidy = computeChildcareSubsidy(
      ani,
      profile.preschool_children,
      profile.childcare_value_per_child
    );

    const netTakeHomeCash =
      postSacrificeGross - incomeTax - employeeNI - studentLoan - extraSippGross;

    const totalPensionPot =
      baseEmpPension +
      baseErPension +
      extraSalarySacrifice +
      erNiPassbackToPension +
      extraSippGross;

    const evNetBenefit = evSacrifice;
    const totalHouseholdWealth =
      netTakeHomeCash + totalPensionPot + cb.netCB + childcareSubsidy + evNetBenefit;

    // Marginal Effective Tax Rate (METR) via +£100 finite difference
    const delta = 100.0;
    const aniPlus = ani + delta;
    const taxPlus = computeIncomeTax(aniPlus, profile.region);
    const niPlus = computeEmployeeNI(postSacrificeGross + delta);
    const slPlus = computeStudentLoans(
      postSacrificeGross + delta,
      profile.student_loan_plan,
      profile.has_postgrad_loan
    );
    const cbPlus = computeChildBenefitNet(aniPlus, profile.child_benefit_children);
    const metr =
      (taxPlus -
        incomeTax +
        (niPlus - employeeNI) +
        (slPlus - studentLoan) -
        (cbPlus.netCB - cb.netCB)) /
      delta;

    return {
      total_comp: round2(totalComp),
      post_sacrifice_gross: round2(postSacrificeGross),
      adjusted_net_income: round2(ani),
      personal_allowance: round2(pa),
      income_tax: round2(incomeTax),
      employee_ni: round2(employeeNI),
      student_loan: round2(studentLoan),
      extra_salary_sacrifice: round2(extraSalarySacrifice),
      extra_sipp_gross: round2(extraSippGross),
      extra_sipp_net_deposit: round2(sippNetDeposit),
      sipp_hmrc_topup: round2(sippHmrcBasicTopup),
      sipp_self_assessment_rebate: round2(sippSelfAssessmentRebate),
      er_ni_passback_to_pension: round2(erNiPassbackToPension),
      er_ni_total_saved: round2(erNiWithoutExtra - erNiWithExtra),
      use_ev_lease: Boolean(evSacrifice > 0),
      ev_gross_sacrifice: round2(evSacrifice),
      ev_bik_addition: round2(evBikAddition),
      gross_child_benefit: round2(cb.grossCB),
      hicbc_charge: round2(cb.hicbcCharge),
      net_child_benefit: round2(cb.netCB),
      childcare_subsidy: round2(childcareSubsidy),
      net_take_home_cash: round2(netTakeHomeCash),
      monthly_take_home_cash: round2(netTakeHomeCash / 12.0),
      total_pension_pot: round2(totalPensionPot),
      total_household_wealth: round2(totalHouseholdWealth),
      marginal_effective_tax_rate: Math.round((metr + Number.EPSILON) * 10000) / 10000,
    };
  }

  function optimizeHouseholdWealth(rawProfile) {
    const profile = normalizeProfile(rawProfile);
    const baseline = evaluateHouseholdState(profile, 0.0, 0.0, false);

    const totalComp = profile.gross_salary + profile.bonus;
    const baseEmpPension = totalComp * profile.existing_pension_pct;
    const baseErPension = totalComp * profile.employer_match_pct;
    const baseAni = baseline.adjusted_net_income;

    const maxAA = computePensionAnnualAllowance(
      totalComp,
      baseErPension,
      profile.carry_forward_allowance
    );
    const remAA = Math.max(0.0, maxAA - baseEmpPension - baseErPension);

    const targetAnis = [
      baseAni,
      125140.0,
      100000.0,
      80000.0,
      75000.0,
      60000.0,
      50270.0,
      43662.0,
    ];

    const candidates = [];
    const evOptions = profile.consider_ev_lease ? [false, true] : [false];

    for (const useEv of evOptions) {
      const evSac = useEv ? profile.ev_gross_annual_lease : 0.0;
      const evBik = useEv ? profile.ev_p11d_value * 0.03 : 0.0;
      const aniAfterEv = Math.max(0.0, baseAni - evSac + evBik);

      const maxSac = Math.min(
        remAA / (1.0 + CONSTANTS.NI_EMPLOYER_RATE * profile.employer_ni_passback_pct),
        Math.max(
          0.0,
          totalComp - baseEmpPension - evSac - CONSTANTS.SALARY_SACRIFICE_NMW_FLOOR
        )
      );
      const maxSipp = Math.min(remAA, aniAfterEv);

      const sacPointsSet = new Set([0.0, round2(maxSac)]);
      const sippPointsSet = new Set([0.0, round2(maxSipp)]);

      for (const tAni of targetAnis) {
        const needed = aniAfterEv - tAni;
        if (needed > 0.0 && needed <= maxSac) {
          sacPointsSet.add(round2(needed));
        }
        if (needed > 0.0 && needed <= maxSipp) {
          sippPointsSet.add(round2(needed));
        }
      }

      const sacPoints = Array.from(sacPointsSet).sort((a, b) => a - b);
      for (const xSac of sacPoints) {
        const st = evaluateHouseholdState(profile, xSac, 0.0, useEv);
        st.strategy_type = useEv ? "ev_plus_salary_sacrifice" : "salary_sacrifice";
        candidates.push(st);
      }

      const sippPoints = Array.from(sippPointsSet).sort((a, b) => a - b);
      for (const xSipp of sippPoints) {
        if (xSipp === 0.0 && !useEv) continue;
        const st = evaluateHouseholdState(profile, 0.0, xSipp, useEv);
        st.strategy_type = useEv ? "ev_plus_sipp" : "personal_sipp";
        candidates.push(st);
      }
    }

    const minAnnualCash = profile.min_monthly_take_home * 12.0;
    let feasible = candidates.filter((c) => c.net_take_home_cash >= minAnnualCash - 1e-2);
    if (feasible.length === 0) feasible = [baseline];

    let globalOpt = feasible[0];
    for (const c of feasible) {
      if (
        c.total_household_wealth > globalOpt.total_household_wealth ||
        (c.total_household_wealth === globalOpt.total_household_wealth &&
          c.net_take_home_cash > globalOpt.net_take_home_cash)
      ) {
        globalOpt = c;
      }
    }

    const primaryTargetAni =
      baseAni > 100000.0 ? 100000.0 : baseAni > 60000.0 ? 60000.0 : 50270.0;
    const trapCandidates = feasible.filter(
      (c) =>
        Math.abs(c.adjusted_net_income - primaryTargetAni) < 1.0 &&
        c.total_household_wealth > baseline.total_household_wealth + 10.0
    );

    let targetedOpt = globalOpt;
    if (trapCandidates.length > 0) {
      let bestScore = -Infinity;
      for (const c of trapCandidates) {
        const wealthGain = c.total_household_wealth - baseline.total_household_wealth;
        const cashDrop = Math.max(1.0, baseline.net_take_home_cash - c.net_take_home_cash);
        const score = wealthGain / cashDrop;
        if (score > bestScore) {
          bestScore = score;
          targetedOpt = c;
        }
      }
    }

    function summarizeGain(optState) {
      const wealthGain = round2(
        optState.total_household_wealth - baseline.total_household_wealth
      );
      const cashDelta = round2(optState.net_take_home_cash - baseline.net_take_home_cash);
      const pensionGain = round2(optState.total_pension_pot - baseline.total_pension_pot);
      const taxSaved = round2(
        baseline.income_tax -
          optState.income_tax +
          (baseline.employee_ni - optState.employee_ni) +
          (baseline.student_loan - optState.student_loan) +
          (baseline.hicbc_charge - optState.hicbc_charge)
      );
      const childcareRestored = round2(
        optState.childcare_subsidy - baseline.childcare_subsidy
      );
      const cashSacrificed = Math.max(0.0, -cashDelta);
      const instantRoiPct =
        cashSacrificed > 1.0
          ? Math.round(((wealthGain / cashSacrificed) * 100.0 + Number.EPSILON) * 10) / 10
          : wealthGain > 0
          ? 999.9
          : 0.0;

      return Object.assign({}, optState, {
        net_wealth_gain: wealthGain,
        net_cash_delta: cashDelta,
        pension_pot_gain: pensionGain,
        total_tax_and_ni_saved: taxSaved,
        childcare_restored: childcareRestored,
        instant_return_on_cash_sacrificed_pct: instantRoiPct,
      });
    }

    const targetedSummary = summarizeGain(targetedOpt);
    const globalSummary = summarizeGain(globalOpt);

    const targetAniForSipp = targetedOpt.adjusted_net_income;
    const sippGrossNeeded = Math.max(0.0, Math.min(remAA, baseAni - targetAniForSipp));
    const sippState = evaluateHouseholdState(profile, 0.0, sippGrossNeeded, false);
    sippState.strategy_type = "personal_sipp";
    const sippEquivalent = summarizeGain(sippState);

    // Evaluate EV Lease standalone impact for CPA & comparison
    const evTempProfile = Object.assign({}, profile, { consider_ev_lease: true });
    const evOnlyState = evaluateHouseholdState(evTempProfile, 0.0, 0.0, true);
    const evNetCashCostAnnual =
      baseline.net_take_home_cash -
      (evOnlyState.net_take_home_cash +
        (evOnlyState.childcare_subsidy - baseline.childcare_subsidy));
    const evEffectiveDiscountPct =
      Math.round(
        (1.0 - Math.max(0.0, evNetCashCostAnnual) / profile.ev_gross_annual_lease) * 1000
      ) / 10;

    return {
      profile,
      pension_annual_allowance: round2(maxAA),
      remaining_pension_allowance: round2(remAA),
      baseline,
      targeted_trap_escape: targetedSummary,
      sipp_lump_sum_equivalent: sippEquivalent,
      global_wealth_optimum: globalSummary,
      ev_simulation: {
        ev_gross_annual_lease: profile.ev_gross_annual_lease,
        ev_p11d_value: profile.ev_p11d_value,
        ev_bik_annual: round2(profile.ev_p11d_value * 0.03),
        ev_net_monthly_cost: round2(Math.max(0.0, evNetCashCostAnnual / 12.0)),
        ev_effective_discount_pct: evEffectiveDiscountPct,
        ani_after_ev: evOnlyState.adjusted_net_income,
        childcare_restored_by_ev: round2(
          evOnlyState.childcare_subsidy - baseline.childcare_subsidy
        ),
      },
    };
  }

  function computeMetrCurve(rawProfile) {
    const profile = normalizeProfile(rawProfile);
    const incomes = [];
    for (let inc = 10000; inc <= 160000; inc += 2500) {
      incomes.push(inc);
    }
    const kinks = [
      12570, 15397, 21000, 25000, 26065, 27491, 28470, 32745, 43662, 50270, 60000, 75000,
      80000, 99900, 100000, 100100, 125140, 125240,
    ];
    for (const k of kinks) {
      if (!incomes.includes(k)) incomes.push(k);
    }
    incomes.sort((a, b) => a - b);

    return incomes.map((inc) => {
      const p = Object.assign({}, profile, {
        gross_salary: inc,
        bonus: 0,
        existing_pension_pct: 0,
        employer_match_pct: 0,
      });
      const st = evaluateHouseholdState(p, 0, 0, false);
      return {
        gross_income: inc,
        net_take_home: st.net_take_home_cash,
        total_household_wealth: st.total_household_wealth,
        metr_pct: round2(st.marginal_effective_tax_rate * 100.0),
        childcare_subsidy: st.childcare_subsidy,
        personal_allowance: st.personal_allowance,
      };
    });
  }

  function computeWealthFrontierCurve(rawProfile) {
    const profile = normalizeProfile(rawProfile);
    const totalComp = profile.gross_salary + profile.bonus;
    const baseEmpPension = totalComp * profile.existing_pension_pct;
    const baseErPension = totalComp * profile.employer_match_pct;
    const maxAA = computePensionAnnualAllowance(
      totalComp,
      baseErPension,
      profile.carry_forward_allowance
    );
    const remAA = Math.max(0.0, maxAA - baseEmpPension - baseErPension);
    const maxSac = Math.min(
      remAA / (1.0 + CONSTANTS.NI_EMPLOYER_RATE * profile.employer_ni_passback_pct),
      Math.max(0.0, totalComp - baseEmpPension - CONSTANTS.SALARY_SACRIFICE_NMW_FLOOR)
    );

    const steps = 60;
    const xs = new Set([0.0, round2(maxSac)]);
    const baseAni = Math.max(0.0, totalComp - baseEmpPension);
    for (const targetAni of [125140, 100000, 99950, 80000, 60000, 50270]) {
      const needed = baseAni - targetAni;
      if (needed > 0 && needed <= maxSac) {
        xs.add(round2(Math.max(0, needed - 50)));
        xs.add(round2(needed));
        xs.add(round2(Math.min(maxSac, needed + 50)));
      }
    }
    for (let i = 0; i <= steps; i++) {
      xs.add(round2((maxSac * i) / steps));
    }

    const sortedXs = Array.from(xs).sort((a, b) => a - b);
    const baseline = evaluateHouseholdState(profile, 0, 0, false);

    return sortedXs.map((x) => {
      const st = evaluateHouseholdState(profile, x, 0, false);
      return {
        extra_sacrifice: x,
        adjusted_net_income: st.adjusted_net_income,
        net_take_home_cash: st.net_take_home_cash,
        total_household_wealth: st.total_household_wealth,
        wealth_gain: round2(st.total_household_wealth - baseline.total_household_wealth),
        cash_cost: round2(Math.max(0, baseline.net_take_home_cash - st.net_take_home_cash)),
      };
    });
  }

  return {
    CONSTANTS,
    computePersonalAllowance,
    computeIncomeTax,
    computeEmployeeNI,
    computeEmployerNI,
    computeStudentLoans,
    computeChildBenefitNet,
    computeChildcareSubsidy,
    computePensionAnnualAllowance,
    evaluateHouseholdState,
    optimizeHouseholdWealth,
    computeMetrCurve,
    computeWealthFrontierCurve,
  };
});
