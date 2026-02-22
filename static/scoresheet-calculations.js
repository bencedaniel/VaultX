// Scoresheet Calculation Functions
// Common JavaScript for scoresheet editing and creation

// Event listeners setup
document.addEventListener('DOMContentLoaded', function() {
  calculateScore();

  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', () => {
      calculateScore();
    });
  }
});

document.querySelectorAll('.input-field').forEach(input => {
  input.addEventListener('change', () => {
    calculateScore();
  });
});

// Set required fields (exclude comment fields)
const inputs = document.querySelectorAll('.input-field');
inputs.forEach(element => {
  if (!element.id.includes('cmnt')) {
    element.required = true;
  }
});



// Utility Functions
function parseLocaleNumber(value) {
  if (typeof value !== 'string') return NaN;
  return parseFloat(value.replace(',', '.'));
}

function excelRound(value, decimals = 1) {
  const multiplier = Math.pow(10, decimals);
  return (Math.round((value * multiplier) + Number.EPSILON) / multiplier).toFixed(decimals);
}

function nullLimit(value) {
  if (value <= 0) {
    return 0.000;
  } else {
    return value;
  }
}

function tenLimit(value) {
  if (value >= 10) {
    return 10.000;
  } else {
    return value;
  }
}

function refreshOutputField(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.innerHTML = value;
  }
}

function transformElement(records, height) {
  if (records) {
    records.style.height = height + '%';
    records.type = 'textarea';
    records.classList.remove('text-center');

    const textarea = document.createElement('textarea');
    textarea.className = records.className;
    textarea.id = records.id;
    textarea.placeholder = records.placeholder;
    textarea.name = records.name;
    textarea.style = records.style.cssText;
    textarea.value = records.value;
    textarea.style.resize = 'none';
    textarea.required = true
    
    records.parentNode.replaceChild(textarea, records);
    textarea.addEventListener('input', () => {
      calculateScore();
    });
  }
}

// Main Calculation Entry Point
function calculateScore() {
  const bannedFields = ['input-records', 'input-dedfalls', 'input-techrecords'];
  horseCalc(bannedFields);
  validateScoreInputs(bannedFields);
  indCompcalc();
  calcSquadPddComp();
  artisticScore();
  techArtisticScore();
  techCalc();
  techtestTechCalc();
}

// Horse Score Calculations
function horseCalc(bannedFields) {
  console.log('Calculating horse score...');
  validateScoreInputs(bannedFields, true);

  const A1 = calcA1();
  const A2 = calcA2();
  const A3 = calcA3();
  if ([A1, A2, A3].every(v => typeof v === 'number' && !Number.isNaN(v))) {
    horseTotal(A1, A2, A3);
  }
}

function calcA1() {
  const rythm = document.getElementById('input-rythm');
  const relaxation = document.getElementById('input-relaxation');
  const connection = document.getElementById('input-connection');
  const impulsion = document.getElementById('input-impulsion');
  const straightness = document.getElementById('input-straightness');
  const collection = document.getElementById('input-collection');
  const a1sum = document.getElementById('output-a1sum');
  const a1total = document.getElementById('output-a1total');
  
  if (rythm && relaxation && connection && impulsion && straightness && collection && a1sum && a1total) {
    const a1percentage = window.scoresheetConfig?.a1percentage || 0;
    const sum = [rythm, relaxation, connection, impulsion, straightness, collection].reduce((acc, curr) => {
      const val = parseLocaleNumber(curr.value);
      return acc + (isNaN(val) ? 0 : val);
    }, 0) / 6;

    a1sum.innerHTML = excelRound(sum, 1);
    const total = (sum * a1percentage);
    a1total.innerHTML = excelRound(total, 3);
    return total;
  }
  return null;
}

function calcA2() {
  const wando = document.getElementById('input-WandO');
  const bint = document.getElementById('input-bint');
  const binc = document.getElementById('input-BinC');
  const a2ded1 = document.getElementById('input-a2ded1');
  const a2ded2 = document.getElementById('input-a2ded2');
  const a2ded3 = document.getElementById('input-a2ded3');
  const a2ded4 = document.getElementById('input-a2ded4');
  const a2ded5 = document.getElementById('input-a2ded5');
  const a2dsum = document.getElementById('output-a2dsum');
  const a2sum = document.getElementById('output-a2sum');
  const a2total = document.getElementById('output-a2total');
  
  const a2percentage = window.scoresheetConfig?.a2percentage || 0;
  let a2dsumval = 0, a2sumval = 0;

  if (a2ded1 && a2ded2 && a2ded3 && a2ded4 && a2ded5 && a2dsum) {
    const sumOfDeductions = [a2ded1, a2ded2, a2ded3, a2ded4, a2ded5].reduce((acc, curr) => {
      const val = parseLocaleNumber(curr.value);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    a2dsum.innerHTML = excelRound(sumOfDeductions, 1);
    a2dsumval = sumOfDeductions;
  }

  if (wando && bint && binc && a2sum) {
    const Corrwando = parseLocaleNumber(wando.value) * 0.5;
    const Corrbint = parseLocaleNumber(binc.value) * 0.25;
    const Corrbinc = parseLocaleNumber(bint.value) * 0.25;
    const sumOfa2 = [Corrwando, Corrbint, Corrbinc].reduce((acc, curr) => {
      return acc + (isNaN(curr) ? 0 : curr);
    }, 0);
    a2sum.innerHTML = excelRound(nullLimit(sumOfa2), 1);
    a2sumval = nullLimit(sumOfa2);
  }

  if (a2sum && a2dsum) {
    const A2 = nullLimit((a2sumval - a2dsumval)) * a2percentage;
    a2total.innerHTML = excelRound(A2, 3);
    return A2;
  }
  return null;
}

function calcA3() {
  const lunging = document.getElementById('input-lunging');
  const a3ded1 = document.getElementById('input-a3ded1');
  const a3ded2 = document.getElementById('input-a3ded2');
  const a3ded3 = document.getElementById('input-a3ded3');
  const a3ded4 = document.getElementById('input-a3ded4');
  const a3ded5 = document.getElementById('input-a3ded5');
  const a3dsum = document.getElementById('output-a3dsum');
  const a3total = document.getElementById('output-a3total');
  const fields = [lunging, a3ded1, a3ded2, a3ded3, a3ded4, a3ded5];

  // Validate decimal places
  fields.forEach(field => {
    if (!field) return;
    const value = field.value.trim();
    if (value === '') return;
    
    const normalizedValue = value.replace(',', '.');
    const parts = normalizedValue.split('.');
    
    if (parts.length === 2 && parts[1].length > 1) {
      ShowErrorToast('Only one decimal place allowed in field: ' + field.id);
    }
  });
  console.log(window.scoresheetConfig);
  const a3percentage = window.scoresheetConfig?.a3percentage || 0;
  let a3dsumval = 0, a3sumval = 0;

  if (a3ded1 && a3ded2 && a3ded3 && a3ded4 && a3ded5 && a3dsum) {
    const sumOfDeductions = [a3ded1, a3ded2, a3ded3, a3ded4, a3ded5].reduce((acc, curr) => {
      const val = parseLocaleNumber(curr.value);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    a3dsum.innerHTML = excelRound(sumOfDeductions, 1);
    a3dsumval = sumOfDeductions;
  }

  if (lunging) {
    a3sumval = parseLocaleNumber(lunging.value) || 0;
  }

  if (a3dsum && lunging) {
    console.log(`Calculating A3: lunging=${a3sumval}, deductions=${a3dsumval}, percentage=${a3percentage}`);
    const A3 = nullLimit((a3sumval - a3dsumval)) * a3percentage;
    a3total.innerHTML = excelRound(A3, 3);
    return A3;
  }
  return null;
}

function horseTotal(A1, A2, A3) {
  const horsetotal = document.getElementById('output-total');
  const totalScoreInput = document.getElementById('totalScore');
  const total = A1 + A2 + A3;
  console.log(`Horse total calculated: A1=${A1}, A2=${A2}, A3=${A3}, Total=${total}`);
  horsetotal.innerHTML = excelRound(total, 3);
  totalScoreInput.value = excelRound(total, 3);
}

// Individual Competition Calculations
function indCompcalc() {
  const inputs = document.querySelectorAll('.input-field');
  const compfields = ['input-vault-on', 'input-flag', 'input-mill', 'input-scrissors-forward', 'input-scrissors-backward', 'input-stand', 'input-flank1st', 'input-swingoff', 'input-basic-seat', 'input-swingforward', 'input-halfMill', 'input-swingBack', 'input-flank'];
  let indcompScaled = 0;
  let NoOfComp = 0;
  const scale = 1000;
  
  inputs.forEach(element => {
    if (compfields.includes(element.getAttribute('id'))) {
      NoOfComp += 1;
      const val = parseLocaleNumber(element.value);
      if (!isNaN(val)) {
        indcompScaled += Math.round(val * scale);
      }
      const indcompElement = document.getElementById('output-sumOfComp');
      if (indcompElement) {
        indcompElement.innerHTML = excelRound(nullLimit(indcompScaled / scale), 3);
      }
    }
  });
  
  if (NoOfComp > 0) {
    const indcompElement = document.getElementById('output-total');
    const totalScoreInput = document.getElementById('totalScore');
    const averageScaled = Math.round(indcompScaled / NoOfComp);
    const average = averageScaled / scale;
    if (totalScoreInput) totalScoreInput.value = excelRound(nullLimit(average), 3);
    if (indcompElement) indcompElement.innerHTML = excelRound(nullLimit(average), 3);
  }
}

// Artistic Score Calculations
function artisticScore() {
  const config = window.scoresheetConfig || {};
  
  const cohInput = document.getElementById('input-coh');
  const cohoutput = document.getElementById('output-cohtotal');
  let CH = 0, C1 = 0, C2 = 0, C3 = 0, C4 = 0;

  if (cohInput && cohoutput) {
    const val = cohInput.value;
    if (!isNaN(parseLocaleNumber(val))) {
      CH = nullLimit(parseLocaleNumber(val)) * (config.artisticCH || 0);
    }
    cohoutput.innerHTML = excelRound(CH, 3);
  }

  const c1Input = document.getElementById('input-c1');
  const c1output = document.getElementById('output-c1total');
  if (c1Input && c1output) {
    const val = c1Input.value;
    if (!isNaN(parseLocaleNumber(val))) {
      C1 = nullLimit(parseLocaleNumber(val)) * (config.artisticC1 || 0);
    }
    c1output.innerHTML = excelRound(C1, 3);
  }

  const c2Input = document.getElementById('input-c2');
  const c2output = document.getElementById('output-c2total');
  if (c2Input && c2output) {
    const val = c2Input.value;
    if (!isNaN(parseLocaleNumber(val))) {
      C2 = nullLimit(parseLocaleNumber(val)) * (config.artisticC2 || 0);
    }
    c2output.innerHTML = excelRound(C2, 3);
  }

  const c3Input = document.getElementById('input-c3');
  const c3output = document.getElementById('output-c3total');
  if (c3Input && c3output) {
    const val = c3Input.value;
    if (!isNaN(parseLocaleNumber(val))) {
      C3 = nullLimit(parseLocaleNumber(val)) * (config.artisticC3 || 0);
    }
    c3output.innerHTML = excelRound(C3, 3);
  }

  const c4Input = document.getElementById('input-c4');
  const c4output = document.getElementById('output-c4total');
  if (c4Input && c4output) {
    const val = c4Input.value;
    if (!isNaN(parseLocaleNumber(val))) {
      C4 = nullLimit(parseLocaleNumber(val)) * (config.artisticC4 || 0);
    }
    c4output.innerHTML = excelRound(C4, 3);
  }

  if (cohInput && c1Input && c2Input && c3Input && c4Input &&
      cohoutput && c1output && c2output && c3output && c4output) {
    const totalArtistic = document.getElementById('output-total');
    const totalScoreInput = document.getElementById('totalScore');
    const deduction = document.getElementById('input-deduction');
    const deductionVal = parseLocaleNumber(deduction?.value) || 0;
    const total = nullLimit((CH + C1 + C2 + C3 + C4) - deductionVal);
    if (totalArtistic) totalArtistic.innerHTML = excelRound(total, 3);
    if (totalScoreInput) totalScoreInput.value = excelRound(total, 3);
  }
}

// Technical Artistic Score Calculations
function techArtisticScore() {
  const config = window.scoresheetConfig || {};
  const tcohInput = document.getElementById('input-tcoh');
  const tcohoutput = document.getElementById('output-tcohtotal');
  let TCH = 0, T1 = 0, T2 = 0, T3 = 0;

  if (tcohInput && tcohoutput) {
    const val = tcohInput.value;
    if (!isNaN(parseLocaleNumber(val))) {
      TCH = nullLimit(parseLocaleNumber(val)) * (config.artistictechCH || 0);
    }
    tcohoutput.innerHTML = excelRound(TCH, 3);
  }

  const t1Input = document.getElementById('input-t1');
  const t1output = document.getElementById('output-t1total');
  let numberOfS = 0, sumOfS = 0;
  const sInputs = ['input-s1', 'input-s2', 'input-s3', 'input-s4', 'input-s5', 'input-s6'];
  const inputs = document.querySelectorAll('.input-field');
  
  inputs.forEach(element => {
    const id = element.getAttribute('id');
    if (sInputs.includes(id)) {
      numberOfS += 1;
      const val = parseLocaleNumber(element.value);
      if (!isNaN(val)) {
        sumOfS += val;
      }
    }
  });

  if (t1Input) {
    if (sumOfS === 0) {
      t1Input.value = '';
    } else {
      T1 = (sumOfS / numberOfS);
      t1Input.value = excelRound(T1, 1);
    }
  }

  if (t1Input && t1output) {
    const val = t1Input.value;
    if (!isNaN(parseLocaleNumber(val))) {
      T1 = nullLimit(parseLocaleNumber(val)) * (config.artisticT1 || 0);
    }
    t1output.innerHTML = excelRound(T1, 3);
  }

  const t2Input = document.getElementById('input-t2');
  const t2output = document.getElementById('output-t2total');
  if (t2Input && t2output) {
    const val = t2Input.value;
    if (!isNaN(parseLocaleNumber(val))) {
      T2 = nullLimit(parseLocaleNumber(val)) * (config.artisticT2 || 0);
    }
    t2output.innerHTML = excelRound(T2, 3);
  }

  const t3Input = document.getElementById('input-t3');
  const t3output = document.getElementById('output-t3total');
  if (t3Input && t3output) {
    const val = t3Input.value;
    if (!isNaN(parseLocaleNumber(val))) {
      T3 = nullLimit(parseLocaleNumber(val)) * (config.artisticT3 || 0);
    }
    t3output.innerHTML = excelRound(T3, 3);
  }

  if (tcohInput && t1Input && t2Input && t3Input &&
      tcohoutput && t1output && t2output && t3output) {
    const totalArtistic = document.getElementById('output-total');
    const totalScoreInput = document.getElementById('totalScore');
    const deduction = document.getElementById('input-deduction');
    const deductionVal = parseLocaleNumber(deduction?.value) || 0;
    const total = nullLimit((TCH + T1 + T2 + T3) - deductionVal);
    if (totalArtistic) totalArtistic.innerHTML = excelRound(total, 3);
    if (totalScoreInput) totalScoreInput.value = excelRound(total, 3);
  }
}

// Squad/Pas de Deux/Comp Calculations
function calcSquadPddComp() {
  const teamNameElement = document.getElementById('output-teamName');
  const vaulter1 = document.getElementById('output-vaulter1');
  const vaulter2 = document.getElementById('output-vaulter2');

  if (teamNameElement || (!teamNameElement && (vaulter1 && vaulter2))) {
    const inputs = document.querySelectorAll('.input-field');
    let vaultOn = 0, flag = 0, mill = 0, scissF = 0, scissB = 0, stand = 0, flank = 0, swingOff = 0, basicSeat = 0, swingF = 0, halfM = 0, swingB = 0;
    const scale = 1000;

    const fieldMappings = {
      'vaultOn': { variable: () => vaultOn, setter: (v) => vaultOn = v, output: 'output-sumOfVaultOn' },
      'flag': { variable: () => flag, setter: (v) => flag = v, output: 'output-sumOfFlag' },
      'mill': { variable: () => mill, setter: (v) => mill = v, output: 'output-sumOfMill' },
      'scissF': { variable: () => scissF, setter: (v) => scissF = v, output: 'output-sumOfScissF' },
      'scissB': { variable: () => scissB, setter: (v) => scissB = v, output: 'output-sumOfScissB' },
      'stand': { variable: () => stand, setter: (v) => stand = v, output: 'output-sumOfStand' },
      'flank': { variable: () => flank, setter: (v) => flank = v, output: 'output-sumOfFlank' },
      'swingOff': { variable: () => swingOff, setter: (v) => swingOff = v, output: 'output-sumOfswingOff' },
      'basicSeat': { variable: () => basicSeat, setter: (v) => basicSeat = v, output: 'output-sumOfbasicSeat' },
      'swingF': { variable: () => swingF, setter: (v) => swingF = v, output: 'output-sumOfSwingF' },
      'halfM': { variable: () => halfM, setter: (v) => halfM = v, output: 'output-sumOfHalfMill' },
      'swingB': { variable: () => swingB, setter: (v) => swingB = v, output: 'output-sumOfSwingB' },
    };
    let numberOffields = 0;

    inputs.forEach(element => {
      const id = element.getAttribute('id');
      for (const [fieldName, config] of Object.entries(fieldMappings)) {
        if (id.includes(fieldName)) {
          numberOffields += 1;
          const val = parseLocaleNumber(element.value);
          if (!isNaN(val)) {
            config.setter(config.variable() + Math.round(val * scale));
          }
          const sum = document.getElementById(config.output);
          if (sum) {
            sum.innerHTML = excelRound(nullLimit(config.variable() / scale), 3);
          }
          break;
        }
      }
    });

    let numberOfVaulters, numberOfExercises;
    if (teamNameElement) {
      numberOfVaulters = 6;
      numberOfExercises = numberOffields / numberOfVaulters;
    } else {
      numberOfVaulters = 2;
      numberOfExercises = numberOffields / numberOfVaulters;
    }

    const sumOfComps = document.getElementById('output-sumOfComp');
    const sumOfCompPerVaulter = document.getElementById('output-sumofCompPerVaulter');
    if (sumOfComps && sumOfCompPerVaulter) {
      const totalScaled = vaultOn + flag + mill + scissF + scissB + stand + flank + swingOff + basicSeat + swingF + halfM + swingB;
      const sumPerVaulterScaled = numberOfVaulters > 0 ? Math.round(totalScaled / numberOfVaulters) : 0;
      sumOfComps.innerHTML = excelRound(nullLimit(totalScaled / scale), 3);
      sumOfCompPerVaulter.innerHTML = excelRound(nullLimit(sumPerVaulterScaled / scale), 3);
      
      const totalComp = document.getElementById('output-total');
      const totalScoreInput = document.getElementById('totalScore');
      const resultScaled = numberOfExercises > 0 ? Math.round(sumPerVaulterScaled / numberOfExercises) : 0;
      const result = resultScaled / scale;
      if (totalComp) totalComp.innerHTML = excelRound(nullLimit(result), 3);
      if (totalScoreInput) totalScoreInput.value = excelRound(nullLimit(result), 3);
    }
  }
}

// Technical Calculations (Free Test)
function techCalc() {
  const records = document.getElementById('input-records');
  if (!records) return;

  const config = window.scoresheetConfig || {};
  let R = 0, D = 0, M = 0, E = 0, sumOfDeductions = 0, sumOfFalls = 0;
  const value = records.value.split(' ');
  const valuewithoutFalls = [];
  const falls = [];

  value.forEach(element => {
    if (element.toLowerCase().includes('f')) {
      falls.push(element);
    } else {
      valuewithoutFalls.push(element);
    }
  });

  const chars = valuewithoutFalls.join(' ').split('');
  document.querySelector('button[type="submit"]').disabled = false;

  chars.forEach((char) => {
    if ((char == 'R' || char == 'r')) {
      if (!document.getElementById('output-noR')) {
        ShowErrorToast('Number of R elements cannot be added in this category');
        document.querySelector('button[type="submit"]').disabled = true;
      } else {
        R++;
      }
    } else if ((char == 'D' || char == 'd')) {
      D++;
    } else if ((char == 'M' || char == 'm')) {
      M++;
    } else if ((char == 'E' || char == 'e')) {
      E++;
    } else if (!isNaN(char)) {
      // Skip numbers
    } else {
      if (char.trim() !== '') {
        document.querySelector('button[type="submit"]').disabled = true;
        ShowErrorToast('Invalid character in records: ' + char);
      }
    }
  });

  let sumOfExercOneStar = 0;
  const deduction = valuewithoutFalls.join(' ').replace(/[^0-9 ]/g, '').split(' ');
  
  deduction.forEach((numStr) => {
    const num = parseInt(numStr);
    if (!isNaN(num)) {
      if (num > 0 && num <= 10) {
        sumOfExercOneStar += 1;
        sumOfDeductions += num;
      } else {
        ShowErrorToast('Invalid deduction number: ' + numStr);
      }
    }
  });

  const deductionFalls = falls.join(' ').replace(/[^0-9 ]/g, '').split(' ');
  deductionFalls.forEach((numStr) => {
    const num = parseInt(numStr);
    if (!isNaN(num)) {
      if (num > 0 && num <= 50) {
        sumOfFalls += num;
      } else {
        ShowErrorToast('Invalid fall deduction number: ' + numStr);
      }
    }
  });

  let perfmultipler = 1;
  let diffmultipler = 1;
  let sumOfExercises = 0;
  
  if ((R + D + M + E) == 0) {
    if (deduction[0] !== '') {
      perfmultipler = 1;
      diffmultipler = 0;
      sumOfExercises = sumOfExercOneStar;
    }
  } else {
    perfmultipler = 0.7;
    diffmultipler = 0.3;
    sumOfExercises = R + D + M + E;
  }

  let pointbyElements = 0;
  let pointbyElementsinv = 0;
  
  if (!isNaN(tenLimit(sumOfDeductions / sumOfExercises))) {
    pointbyElements = tenLimit(sumOfDeductions / sumOfExercises);
    pointbyElementsinv = 10 - pointbyElements;
  }

  const PerformanceScore = nullLimit(pointbyElementsinv - (sumOfFalls / 10));
  const MaxExercisesCount = config.NumberOfMaxExercises || 10;
  let MaxR = 0, MaxD = 0, MaxM = 0, MaxE = 0;
  let ClonedR = R, ClonedD = D, ClonedM = M, ClonedE = E;

  while (true) {
    const sumCheck = MaxR + MaxD + MaxM + MaxE;
    if (sumCheck == MaxExercisesCount || (ClonedR == 0 && ClonedD == 0 && ClonedM == 0 && ClonedE == 0)) {
      break;
    }
    if (ClonedR > 0) {
      MaxR += 1;
      ClonedR -= 1;
    } else if (ClonedD > 0) {
      MaxD += 1;
      ClonedD -= 1;
    } else if (ClonedM > 0) {
      MaxM += 1;
      ClonedM -= 1;
    } else if (ClonedE > 0) {
      MaxE += 1;
      ClonedE -= 1;
    }
  }

  const Rscore = MaxR * (config.Rmultipler || 0);
  const Dscore = MaxD * (config.Dmultipler || 0);
  const Mscore = MaxM * (config.Mmultipler || 0);
  const Escore = MaxE * (config.Emultipler || 0);
  const DiffTotal = tenLimit(Rscore + Dscore + Mscore + Escore);
  const total = DiffTotal * diffmultipler + PerformanceScore * perfmultipler;

  const Fields = {
    noR: { element: document.getElementById('output-noR'), variable: () => R },
    noD: { element: document.getElementById('output-noD'), variable: () => D },
    noM: { element: document.getElementById('output-noM'), variable: () => M },
    noE: { element: document.getElementById('output-noE'), variable: () => E },
    sumOfDeductions: { element: document.getElementById('output-sumofdeductions'), variable: () => sumOfDeductions },
    sumOfFalls: { element: document.getElementById('output-deductForFalls'), variable: () => excelRound(sumOfFalls / 10) },
    sumOfExercises: { element: document.getElementById('output-sumofExerc'), variable: () => sumOfExercises },
    sumOfExercises1: { element: document.getElementById('output-sumofelements'), variable: () => sumOfExercises },
    pointbyElements: { element: document.getElementById('output-pointbyelements'), variable: () => excelRound(tenLimit(pointbyElements), 3) },
    pointbyElementsinv: { element: document.getElementById('output-pointbyelementsinv'), variable: () => excelRound(tenLimit(pointbyElementsinv), 3) },
    performanceScore: { element: document.getElementById('output-scorePerformance'), variable: () => excelRound(PerformanceScore, 3) },
    MaxR: { element: document.getElementById('output-noR10'), variable: () => MaxR },
    MaxD: { element: document.getElementById('output-noD10'), variable: () => MaxD },
    MaxM: { element: document.getElementById('output-noM10'), variable: () => MaxM },
    MaxE: { element: document.getElementById('output-noE10'), variable: () => MaxE },
    Rscore: { element: document.getElementById('output-Rscore'), variable: () => excelRound(Rscore, 3) },
    Dscore: { element: document.getElementById('output-Dscore'), variable: () => excelRound(Dscore, 3) },
    Mscore: { element: document.getElementById('output-Mscore'), variable: () => excelRound(Mscore, 3) },
    Escore: { element: document.getElementById('output-Escore'), variable: () => excelRound(Escore, 3) },
    DiffTotal: { element: document.getElementById('output-scorediff'), variable: () => excelRound(DiffTotal, 3) },
    totalScore: { element: document.getElementById('output-total'), variable: () => excelRound(total, 3) },
  };

  Object.values(Fields).forEach((field) => {
    if (field.element) {
      field.element.innerHTML = field.variable();
    }
  });

  const totalScoreInput = document.getElementById('totalScore');
  if (totalScoreInput) totalScoreInput.value = excelRound(total, 3);
}

// Technical Test Tech Calculations
function techtestTechCalc() {
  const records = document.getElementById('input-techrecords');
  if (!records) return;

  const config = window.scoresheetConfig || {};
  let sumOfDeductions = 0, sumOfFalls = 0;
  const value = records.value.split(' ');
  const valuewithoutFalls = [];
  const falls = [];

  value.forEach(element => {
    if (element.toLowerCase().includes('f')) {
      falls.push(element);
    } else {
      valuewithoutFalls.push(element);
    }
  });

  const deduction = valuewithoutFalls.join(' ').replace(/[^0-9 ]/g, '').split(' ');
  let sumOfExercises = 0;

  deduction.forEach((numStr) => {
    const num = parseInt(numStr);
    if (!isNaN(num)) {
      if (num >= 0 && num <= 10) {
        sumOfExercises += 1;
        sumOfDeductions += num;
      } else {
        ShowErrorToast('Invalid deduction number: ' + numStr);
      }
    }
  });

  const deductionFalls = falls.join(' ').replace(/[^0-9 ]/g, '').split(' ');
  deductionFalls.forEach((numStr) => {
    const num = parseInt(numStr);
    if (!isNaN(num)) {
      if (num >= 0 && num <= 50) {
        sumOfFalls += num;
      } else {
        ShowErrorToast('Invalid fall deduction number: ' + numStr);
      }
    }
  });

  let pointbyElements = 0;
  let pointbyElementsinv = 0;
  
  if (!isNaN(tenLimit(sumOfDeductions / sumOfExercises))) {
    pointbyElements = tenLimit(sumOfDeductions / sumOfExercises);
    pointbyElementsinv = 10 - pointbyElements;
  }

  const PerformanceScore = nullLimit(pointbyElementsinv - (sumOfFalls / 10));
  const TechExercFields = ['input-standBackward', 'input-cartwheel', 'input-lowerarmstand', 'input-mountreverse', 'input-standsplit'];
  let sum = PerformanceScore;

  TechExercFields.forEach((fieldId) => {
    const fieldElement = document.getElementById(fieldId);
    if (fieldElement) {
      const val = parseLocaleNumber(fieldElement.value);
      if (!isNaN(val) && val >= 0 && val <= 10) {
        sum += val;
      }
    }
  });

  const total = tenLimit(sum / (config.techDivider || 1));

  const Fields = {
    sumOfDeductions: { element: document.getElementById('output-sumofdeductions'), variable: () => sumOfDeductions },
    sumOfFalls: { element: document.getElementById('output-sumOffalls'), variable: () => excelRound(sumOfFalls / 10) },
    sumOfExercises: { element: document.getElementById('output-sumofExerc'), variable: () => sumOfExercises },
    sumOfExercises1: { element: document.getElementById('output-sumofelements'), variable: () => sumOfExercises },
    pointbyElements: { element: document.getElementById('output-pointbyelements'), variable: () => excelRound(tenLimit(pointbyElements), 3) },
    pointbyElementsinv: { element: document.getElementById('output-pointbyelementsinv'), variable: () => excelRound(tenLimit(pointbyElementsinv), 3) },
    performanceScore: { element: document.getElementById('output-score'), variable: () => excelRound(PerformanceScore, 3) },
    sum: { element: document.getElementById('output-sum'), variable: () => excelRound(sum, 3) },
    totalScore: { element: document.getElementById('output-total'), variable: () => excelRound(total, 3) },
  };

  Object.values(Fields).forEach((field) => {
    if (field.element) {
      field.element.innerHTML = field.variable();
    }
  });

  const totalScoreInput = document.getElementById('totalScore');
  if (totalScoreInput) totalScoreInput.value = excelRound(total, 3);
}

// Validation
function validateScoreInputs(bannedFields, horse = false) {
  let issuedFields = 0;
  const inputs = document.querySelectorAll('.input-field');
  
  inputs.forEach(element => {
    const id = element.getAttribute('id');
    if (!bannedFields.includes(id)) {
      if (isNaN(element.value.replace(',', '.')) && element.value.trim() !== '') {
        ShowErrorToast('Invalid input in field: ' + id);
        element.value = '';
        issuedFields += 1;
      }
      
      const val = parseLocaleNumber(element.value);
      if (isNaN(val) && element.value.trim() !== '') {
        ShowErrorToast('Invalid input in field: ' + id);
        element.value = '';
        issuedFields += 1;
      } else if (!isNaN(val) && (val > 10 || val < 0)) {
        ShowErrorToast('Invalid input in field: ' + id);
        element.value = '';
        issuedFields += 1;
      }
      
      if (horse) {
        if (!isNaN(val) && (val * 10) % 1 !== 0) {
          ShowErrorToast('Only one decimal place allowed in field: ' + id);
          element.value = '';
          issuedFields += 1;
        }
      }
    }
  });

  console.log('Issued fields: ' + issuedFields);
  const submitButton = document.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = issuedFields > 0;
  }
}
