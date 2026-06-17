import { parseSchemeTitle } from "../src/utils/schemeParser";

const runTests = () => {
  const tests = [
    {
      input: "HDFC Banking & Financial Services Fund - Growth Option - Direct Plan",
      expected: {
        baseName: "HDFC Banking & Financial Services Fund",
        planType: "Direct",
        optionType: "Growth"
      }
    },
    {
      input: "Axis Midcap Fund - Regular Plan - IDCW",
      expected: {
        baseName: "Axis Midcap Fund",
        planType: "Regular",
        optionType: "IDCW"
      }
    },
    {
      input: "SBI Bluechip Fund - Direct Plan - Dividend",
      expected: {
        baseName: "SBI Bluechip Fund",
        planType: "Direct",
        optionType: "IDCW"
      }
    },
    {
      input: "ICICI Prudential Equity & Debt Fund - Reinvestment",
      expected: {
        baseName: "ICICI Prudential Equity & Debt Fund",
        planType: "",
        optionType: "IDCW"
      }
    },
    {
      input: "Nippon India Small Cap Fund - Growth",
      expected: {
        baseName: "Nippon India Small Cap Fund",
        planType: "",
        optionType: "Growth"
      }
    },
    {
      input: "Kotak Emerging Equity Fund - Regular Plan",
      expected: {
        baseName: "Kotak Emerging Equity Fund",
        planType: "Regular",
        optionType: ""
      }
    },
    {
      input: "Mirae Asset Large Cap Fund - Payout",
      expected: {
        baseName: "Mirae Asset Large Cap Fund",
        planType: "",
        optionType: "IDCW"
      }
    },
    {
      input: "Parag Parikh Flexi Cap Fund",
      expected: {
        baseName: "Parag Parikh Flexi Cap Fund",
        planType: "",
        optionType: ""
      }
    },
    {
      input: "Fund with dangling hyphens - Direct Plan - - ",
      expected: {
        baseName: "Fund with dangling hyphens",
        planType: "Direct",
        optionType: ""
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(({ input, expected }, index) => {
    const output = parseSchemeTitle(input);
    const pass = 
      output.baseName === expected.baseName &&
      output.planType === expected.planType &&
      output.optionType === expected.optionType;

    if (pass) {
      passed++;
      console.log(`[PASS] Test ${index + 1}: ${input}`);
    } else {
      failed++;
      console.error(`[FAIL] Test ${index + 1}: ${input}`);
      console.error(`  Expected:`, expected);
      console.error(`  Got:     `, output);
    }
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);

  if (failed > 0) {
    process.exit(1);
  }
};

runTests();
